import { Prisma, type PrismaClient } from "@prisma/client";

import { getDueDays } from "@/lib/billing/draft-repeat";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { toBillerInvoiceRecord } from "@/lib/billing/invoice-mapping";
import type { IssueOutcome, IssueRunStore } from "@/lib/billing/issue-run";

const json = (value: unknown) => (value === null || value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue));

// Lo que se guarda de cada resultado. "found" es un comprobante que ya estaba
// en Biller con ese numero_interno: se toma tal cual lo informa Biller.
export const toOutcomeUpdate = (outcome: IssueOutcome, at: Date): Prisma.InvoiceUpdateInput => {
  if (outcome.kind === "issued") {
    return {
      billerId: outcome.cfe.billerId,
      billerStatus: null,
      dueDate: outcome.dueDate,
      error: null,
      issueDate: outcome.issueDate,
      number: outcome.cfe.number,
      paymentForm: outcome.paymentForm,
      series: outcome.cfe.series,
      status: "ISSUED",
    };
  }
  if (outcome.kind === "found") {
    const record = toBillerInvoiceRecord(outcome.row);
    return {
      billerCreatedAt: record.billerCreatedAt,
      billerId: record.billerId,
      billerStatus: record.billerStatus,
      billerSucursal: record.billerSucursal,
      cae: json(record.cae),
      dueDate: record.dueDate,
      error: null,
      issueDate: record.issueDate,
      number: record.number,
      series: record.series,
      status: record.status,
      syncedAt: at,
      total: record.total,
    };
  }
  return { error: outcome.message, status: outcome.kind === "failed" ? "DRAFT" : "UNKNOWN" };
};

export const createIssueRunStore = (db: PrismaClient): IssueRunStore => ({
  nextIssuing: async (batchId, skipIds) => {
    const invoice = await db.invoice.findFirst({
      where: { batchId, id: { notIn: skipIds }, status: "ISSUING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        adenda: true, cfeType: true, currency: true, dueDays: true, id: true, internalNumber: true, items: true, paymentForm: true,
        purchaseOrder: true, receiver: true, sourceInvoice: { select: { dueDate: true, issueDate: true } },
      },
    });
    if (!invoice) return null;
    return {
      adenda: invoice.adenda,
      batchId,
      cfeType: invoice.cfeType,
      currency: invoice.currency,
      // Una factura nueva guarda sus días de crédito; una repetida, los de su origen.
      dueDays: invoice.dueDays ?? (invoice.sourceInvoice ? getDueDays(invoice.sourceInvoice) : null),
      id: invoice.id,
      internalNumber: invoice.internalNumber,
      items: readStoredItems(invoice.items),
      paymentForm: invoice.paymentForm,
      purchaseOrder: invoice.purchaseOrder,
      receiver: readStoredReceiver(invoice.receiver),
    };
  },

  // Cada resultado toca el updatedAt del lote: así se sabe que la emisión sigue viva.
  saveOutcome: async (candidate, outcome, at) => {
    await db.$transaction([
      db.invoice.update({ where: { id: candidate.id }, data: toOutcomeUpdate(outcome, at) }),
      db.invoiceBatch.update({ where: { id: candidate.batchId }, data: { updatedAt: at } }),
    ]);
  },

  failRemaining: async (batchId, message, at) => {
    const { count } = await db.invoice.updateMany({
      where: { batchId, status: "ISSUING" },
      data: { error: message, status: "DRAFT" },
    });
    await db.invoiceBatch.update({ where: { id: batchId }, data: { updatedAt: at } });
    return count;
  },

  // ISSUING si algo quedó a medio emitir (se continúa después), DRAFT si
  // quedan facturas sin emitir o sin confirmar, DONE si se emitió todo.
  finishBatch: async (batchId, at) => {
    const groups = await db.invoice.groupBy({ by: ["status"], where: { batchId }, _count: { _all: true } });
    const has = (status: string) => groups.some((group) => group.status === status && group._count._all > 0);
    const status = has("ISSUING") ? "ISSUING" : has("DRAFT") || has("UNKNOWN") ? "DRAFT" : "DONE";
    await db.invoiceBatch.update({ where: { id: batchId }, data: { status, updatedAt: at } });
  },
});
