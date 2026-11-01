import type { PrismaClient } from "@prisma/client";

import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { buildIssuePlan, type IssueInput } from "@/lib/billing/issue-payload";
import { FatalIssueError, sendWithLookup, type IssueOutcome, type SendDeps } from "@/lib/billing/issue-run";
import { toOutcomeUpdate } from "@/lib/billing/issue-store";

export type NewInvoiceRunStore = {
  load: (invoiceId: string) => Promise<(IssueInput & { issueDate: Date }) | null>;
  save: (invoiceId: string, outcome: IssueOutcome, at: Date) => Promise<void>;
};

export type NewInvoiceRunDeps = SendDeps & { now: () => Date; store: NewInvoiceRunStore };

export type NewInvoiceRunResult =
  | { kind: "issued"; number: number; series: string }
  | { kind: "found"; number: number; series: string | null }
  | { kind: "failed"; message: string }
  | { kind: "unknown"; message: string };

// Manda la factura nueva que quedó en ISSUING al confirmar (feature 45), con
// la fecha de emisión que eligió la página. Mismas reglas que el lote (regla
// 3): ante una respuesta dudosa se busca por su numero_interno antes de
// reintentar y, si no se sabe, queda UNKNOWN.
export const runNewInvoiceIssue = async (invoiceId: string, deps: NewInvoiceRunDeps): Promise<NewInvoiceRunResult> => {
  const input = await deps.store.load(invoiceId);
  if (!input) return { kind: "failed", message: "La factura ya no está para emitir" };
  const plan = buildIssuePlan(input, input.issueDate);

  let outcome: IssueOutcome;
  if (!plan.ok) {
    outcome = { kind: "failed", message: plan.error };
  } else {
    try {
      const sent = await sendWithLookup(plan.payload, deps, async () => undefined);
      outcome = sent.kind === "issued"
        ? { cfe: sent.cfe, dueDate: plan.dueDate, issueDate: plan.issueDate, kind: "issued", paymentForm: plan.paymentForm }
        : sent;
    } catch (error) {
      if (!(error instanceof FatalIssueError)) throw error;
      outcome = { kind: "failed", message: error.message };
    }
  }
  await deps.store.save(invoiceId, outcome, deps.now());

  if (outcome.kind === "issued") return { kind: "issued", number: outcome.cfe.number, series: outcome.cfe.series };
  if (outcome.kind === "found") return { kind: "found", number: outcome.row.numero, series: outcome.row.serie ?? null };
  return outcome;
};

export const createNewInvoiceRunStore = (db: PrismaClient): NewInvoiceRunStore => ({
  load: async (invoiceId) => {
    const invoice = await db.invoice.findFirst({
      where: { batchId: null, id: invoiceId, status: "ISSUING" },
      select: {
        adenda: true, cfeType: true, currency: true, dueDays: true, internalNumber: true, issueDate: true, items: true,
        paymentForm: true, purchaseOrder: true, receiver: true,
      },
    });
    if (!invoice?.issueDate) return null;
    return {
      adenda: invoice.adenda,
      cfeType: invoice.cfeType,
      currency: invoice.currency,
      dueDays: invoice.dueDays,
      internalNumber: invoice.internalNumber,
      issueDate: invoice.issueDate,
      items: readStoredItems(invoice.items),
      paymentForm: invoice.paymentForm,
      purchaseOrder: invoice.purchaseOrder,
      receiver: readStoredReceiver(invoice.receiver),
    };
  },

  // Un rechazo de datos no creó nada en Biller: la factura se borra y la
  // página dice por qué (el mismo pedido se puede corregir y volver a emitir).
  save: async (invoiceId, outcome, at) => {
    if (outcome.kind === "failed") {
      await db.invoice.deleteMany({ where: { id: invoiceId, status: "ISSUING" } });
      return;
    }
    await db.invoice.update({ where: { id: invoiceId }, data: toOutcomeUpdate(outcome, at) });
  },
});
