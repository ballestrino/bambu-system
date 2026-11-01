import { Prisma, type PrismaClient } from "@prisma/client";

import { getBillingMonthName } from "@/lib/billing/billing-month-text";
import { getPeriodOfIssueDate, parseBillingPeriod } from "@/lib/billing/billing-month";
import { lockBillingPeriod } from "@/lib/billing/draft-store";
import { ISSUE_STALE_MS, lockBatch } from "@/lib/billing/issue-claim";
import {
  getNewInvoiceDueDays,
  getNewInvoiceItems,
  getNewInvoiceProblems,
  getNewInvoiceReceiver,
  getNewInvoiceTotals,
} from "@/lib/billing/new-invoice";
import type { NewInvoiceRequest } from "@/schemas/billing-new-invoice";

type Tx = Prisma.TransactionClient;
const json = (value: unknown) => (value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue));

// Una factura nueva a la vez por pedido: el doble clic o un reintento esperan
// este lock y encuentran la factura que creó el primero.
const lockRequest = (tx: Tx, requestId: string) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`new-invoice:${requestId}`}))`;

const monthLabel = (period: Date) => `${getBillingMonthName(period)} ${period.getUTCFullYear()}`;

// Lo que se guarda de la factura, igual para emitirla o para el borrador.
const toInvoiceData = (request: NewInvoiceRequest) => {
  const { form } = request;
  const receiver = getNewInvoiceReceiver(form);
  return {
    adenda: form.adenda.trim() || null,
    cfeType: form.cfeType,
    currency: form.currency,
    dueDays: getNewInvoiceDueDays(form),
    internalNumber: `BAMBU-${request.requestId}`,
    items: json(getNewInvoiceItems(form)),
    origin: "APP" as const,
    paymentForm: form.paymentForm,
    purchaseOrder: form.purchaseOrder.trim() || null,
    receiver: json(receiver),
    receiverDocument: receiver?.documento ?? null,
    selected: true,
    total: getNewInvoiceTotals(form).total,
  };
};

export type NewInvoiceClaim =
  | { invoiceId: string; kind: "claimed" }
  | { invoiceId: string; kind: "done" }
  | { error: string; kind: "error" };

// "Emitir ahora": crea la factura en ISSUING con el id del pedido, o toma la
// que ya existe. Una emitida no se vuelve a mandar; una sin confirmar (o que
// quedó en ISSUING hace rato) se reintenta con el mismo número interno.
export const claimNewInvoiceIssue = (db: PrismaClient, request: NewInvoiceRequest, userId: string, now: Date, today: string) =>
  db.$transaction<NewInvoiceClaim>(async (tx) => {
    await lockRequest(tx, request.requestId);
    const existing = await tx.invoice.findUnique({ where: { id: request.requestId }, select: { status: true, updatedAt: true } });
    if (existing) {
      if (existing.status === "DRAFT") return { error: "Esta factura ya está guardada en el borrador", kind: "error" };
      const stale = existing.status === "ISSUING" && now.getTime() - existing.updatedAt.getTime() > ISSUE_STALE_MS;
      if (existing.status !== "UNKNOWN" && !stale) {
        return existing.status === "ISSUING"
          ? { error: "La factura ya se está emitiendo", kind: "error" }
          : { invoiceId: request.requestId, kind: "done" };
      }
      await tx.invoice.update({ where: { id: request.requestId }, data: { error: null, status: "ISSUING" } });
      return { invoiceId: request.requestId, kind: "claimed" };
    }

    const problems = getNewInvoiceProblems(request.form, today);
    if (problems.length) return { error: problems[0], kind: "error" };
    const issueDate = new Date(`${request.form.issueDate}T00:00:00Z`);
    await tx.invoice.create({
      data: {
        ...toInvoiceData(request),
        createdById: userId,
        id: request.requestId,
        issueDate,
        period: getPeriodOfIssueDate(issueDate),
        status: "ISSUING",
      },
    });
    return { invoiceId: request.requestId, kind: "claimed" };
  });

export type NewInvoiceDraftResult =
  | { batchId: string; created: boolean; month: string; ok: true }
  | { error: string; ok: false };

// "Guardar en el borrador de <mes>": con el lock del mes la suma marcada al
// borrador abierto o crea uno (MANUAL). El mismo lock de lote que "Emitir N":
// un borrador que se está emitiendo no se toca. Guardar dos veces el mismo
// pedido no la duplica.
export const saveNewInvoiceDraft = async (db: PrismaClient, request: NewInvoiceRequest, userId: string, today: string) => {
  const period = parseBillingPeriod(request.month);
  if (!period) return { error: "Mes inválido", ok: false } satisfies NewInvoiceDraftResult;
  const problems = getNewInvoiceProblems(request.form, today);
  if (problems.length) return { error: problems[0], ok: false } satisfies NewInvoiceDraftResult;
  const month = monthLabel(period);

  return db.$transaction<NewInvoiceDraftResult>(
    async (tx) => {
      await lockBillingPeriod(tx, period);
      await lockRequest(tx, request.requestId);
      const existing = await tx.invoice.findUnique({ where: { id: request.requestId }, select: { batchId: true, status: true } });
      if (existing) {
        return existing.status === "DRAFT" && existing.batchId
          ? { batchId: existing.batchId, created: false, month, ok: true }
          : { error: "Esta factura ya se emitió", ok: false };
      }

      let batch = await tx.invoiceBatch.findFirst({ where: { period }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
      if (batch?.status === "ISSUING") return { error: `El borrador de ${month} se está emitiendo: probá en un rato`, ok: false };
      let created = false;
      if (!batch || batch.status === "DONE") {
        batch = await tx.invoiceBatch.create({
          data: { createdById: userId, origin: "MANUAL", period, status: "DRAFT" },
          select: { id: true, status: true },
        });
        created = true;
      }
      await lockBatch(tx, batch.id);
      const current = await tx.invoiceBatch.findUnique({ where: { id: batch.id }, select: { status: true } });
      if (current?.status !== "DRAFT") return { error: `El borrador de ${month} cambió de estado: volvé a intentar`, ok: false };

      const updatedAt = new Date();
      await tx.invoice.create({
        data: { ...toInvoiceData(request), batchId: batch.id, createdById: userId, id: request.requestId, period, status: "DRAFT" },
      });
      // Mueve el updatedAt del lote: un "Emitir N" abierto ve que cambió.
      await tx.invoiceBatch.update({ where: { id: batch.id }, data: { updatedAt } });
      return { batchId: batch.id, created, month, ok: true };
    },
    { timeout: 20_000 }
  );
};
