import { Prisma, type PrismaClient } from "@prisma/client";

import {
  NEW_INVOICE_DEFAULTS,
  planDraftAddition,
  planDraftChanges,
  type AgentDraftAddition,
  type AgentDraftChange,
  type AgentDraftNote,
  type PlannedAddition,
} from "@/lib/billing/agent-draft-plan";
import type { BillerRutData } from "@/lib/billing/biller-read";
import { getBillingMonthName } from "@/lib/billing/billing-month-text";
import { createRepeatDraft, lockBillingPeriod } from "@/lib/billing/draft-store";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getItemsTotal } from "@/lib/billing/invoice-totals";
import { lockBatch } from "@/lib/billing/issue-claim";

export type AgentDraftInput = {
  additions: { addition: AgentDraftAddition; rutData: BillerRutData }[];
  changes: AgentDraftChange[];
  conversationId: string;
  period: Date;
  repeat: boolean;
  userId: string;
};

export type AgentDraftResult =
  | { batchId: string; created: boolean; notes: AgentDraftNote[]; ok: true }
  | { error: string; ok: false };

const ISSUED = ["ISSUED", "ACCEPTED", "UNKNOWN"] as const;

const monthLabel = (period: Date) => `${getBillingMonthName(period)} ${period.getUTCFullYear()}`;

// El indicador de IVA de la última factura emitida: el de una factura nueva.
const getLastIndicator = async (tx: Prisma.TransactionClient) => {
  const last = await tx.invoice.findFirst({
    where: { cfeType: { in: [101, 111] }, items: { not: Prisma.DbNull }, status: { in: [...ISSUED] } },
    orderBy: [{ issueDate: "desc" }, { number: "desc" }],
    select: { items: true },
  });
  return readStoredItems(last?.items)?.[0]?.indicador_facturacion ?? null;
};

// draftInvoices (docs/billing.md, regla 1): crea o cambia el borrador del mes
// y nunca emite. Repetir usa createRepeatDraft (un único borrador abierto por
// mes); el resto va en una transacción con el lock del mes y el del lote, el
// mismo que toma "Emitir": un borrador en ISSUING o DONE no se toca. Cada
// cambio mueve el updatedAt del lote, así un diálogo abierto en la página
// rechaza emitir lo que ya no vio.
export const applyAgentDraft = async (db: PrismaClient, input: AgentDraftInput): Promise<AgentDraftResult> => {
  let created = false;
  if (input.repeat) {
    const repeated = await createRepeatDraft(db, {
      conversationId: input.conversationId,
      origin: "AGENT",
      period: input.period,
      userId: input.userId,
    });
    if ("error" in repeated && !input.additions.length) {
      return { error: `${monthLabel(input.period)}: el mes anterior no tiene facturas emitidas para repetir`, ok: false };
    }
    if ("created" in repeated) created = repeated.created;
  }

  return db.$transaction<AgentDraftResult>(
    async (tx) => {
      await lockBillingPeriod(tx, input.period);
      let batch = await tx.invoiceBatch.findFirst({
        where: { period: input.period },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
      });
      if (batch?.status === "ISSUING") {
        return { error: `El borrador de ${monthLabel(input.period)} se está emitiendo: no se puede cambiar`, ok: false };
      }
      if (!batch || batch.status === "DONE") {
        if (input.changes.length || !input.additions.length) {
          return {
            error: batch
              ? `El borrador de ${monthLabel(input.period)} ya se emitió: lo emitido se corrige con una nota de crédito desde la página`
              : `No hay borrador de ${monthLabel(input.period)}: repetí el mes anterior o sumá una factura nueva`,
            ok: false,
          };
        }
        batch = await tx.invoiceBatch.create({
          data: { conversationId: input.conversationId, createdById: input.userId, origin: "AGENT", period: input.period, status: "DRAFT" },
          select: { id: true, status: true },
        });
        created = true;
      }
      const batchId = batch.id;
      await lockBatch(tx, batchId);
      const current = await tx.invoiceBatch.findUnique({ where: { id: batchId }, select: { status: true } });
      if (current?.status !== "DRAFT") return { error: "El borrador cambió de estado: volvé a leerlo", ok: false };

      const invoices = (
        await tx.invoice.findMany({
          where: { batchId },
          select: { id: true, items: true, receiver: true, receiverDocument: true, selected: true, status: true },
        })
      ).map((row) => ({ ...row, items: readStoredItems(row.items), receiver: readStoredReceiver(row.receiver) }));

      const plan = planDraftChanges(invoices, input.changes);
      if (!plan.ok) return { error: plan.error, ok: false };

      const added: PlannedAddition[] = [];
      const indicator = input.additions.length ? await getLastIndicator(tx) : null;
      for (const { addition, rutData } of input.additions) {
        const existing = [...invoices, ...added.map((row) => ({ ...row, id: "", selected: true, status: "DRAFT" }))];
        const planned = planDraftAddition(addition, rutData, existing, indicator);
        if ("error" in planned) return { error: planned.error, ok: false };
        added.push(planned);
      }

      const updatedAt = new Date();
      for (const edit of plan.edits) {
        await tx.invoice.update({
          where: { id: edit.invoiceId },
          data: {
            ...(edit.items ? { items: edit.items as Prisma.InputJsonValue, total: getItemsTotal(edit.items) } : {}),
            ...(edit.selected !== null ? { selected: edit.selected } : {}),
            updatedAt,
          },
        });
      }
      for (const row of added) {
        await tx.invoice.create({
          data: {
            ...NEW_INVOICE_DEFAULTS,
            batchId,
            createdById: input.userId,
            items: row.items as Prisma.InputJsonValue,
            origin: "APP",
            period: input.period,
            receiver: row.receiver as Prisma.InputJsonValue,
            receiverDocument: row.receiverDocument,
            selected: true,
            status: "DRAFT",
            total: row.total,
          },
        });
      }
      if (added.length) {
        // numero_interno de cada factura: Biller lo rechaza repetido (regla 3).
        await tx.$executeRaw`UPDATE "Invoice" SET "internalNumber" = 'BAMBU-' || "id" WHERE "batchId" = ${batchId} AND "internalNumber" IS NULL`;
      }
      if (plan.edits.length || added.length) {
        await tx.invoiceBatch.update({ where: { id: batchId }, data: { updatedAt } });
      }

      return {
        batchId,
        created,
        notes: [...plan.edits.flatMap((edit) => edit.notes), ...added.map((row) => row.note)],
        ok: true,
      };
    },
    { timeout: 20_000 }
  );
};
