import "server-only";

import { getBillerStatus } from "@/lib/billing/biller-server";
import { getBillingPeriodKey, getPeriodOfIssueDate } from "@/lib/billing/billing-month";
import { CREDIT_NOTE_TYPE, getCreditBlocker, getCreditState } from "@/lib/billing/credit-note-plan";
import { getReceiverName, readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getCfeLabel } from "@/lib/billing/invoice-mapping";
import { getLineSubtotal, getTaxRate } from "@/lib/billing/invoice-totals";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

// La página "Nota de crédito" de una factura emitida (feature 43): la
// factura que corrige con sus líneas, las notas que ya tiene, lo que queda
// por acreditar y por qué no se puede, si no se puede.
export const getCreditNoteView = async (invoiceId: string) => {
  await requireAdminSession();
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      billerId: true, billerStatus: true, cfeType: true, currency: true, id: true, issueDate: true, items: true,
      number: true, period: true, receiver: true, series: true, status: true, total: true,
    },
  });
  if (!invoice) return null;

  const notes = invoice.billerId === null
    ? []
    : await db.invoice.findMany({
        where: { referenceIds: { has: invoice.billerId }, status: { not: "DRAFT" } },
        select: { billerStatus: true, cfeType: true, error: true, id: true, issueDate: true, number: true, referenceReason: true, series: true, status: true, total: true },
        orderBy: { createdAt: "asc" },
      });
  const items = readStoredItems(invoice.items);
  const receiver = readStoredReceiver(invoice.receiver);
  const total = Number(invoice.total);
  const noteStates = notes.map((note) => ({ ...note, total: Number(note.total) }));
  const source = { ...invoice, items, total };
  const state = getCreditState(source, noteStates);
  const noteType = CREDIT_NOTE_TYPE[invoice.cfeType] ?? null;

  return {
    biller: getBillerStatus(),
    blocker: getCreditBlocker(source, noteStates),
    credited: state.credited,
    invoice: {
      billerStatus: invoice.billerStatus,
      cfeLabel: getCfeLabel(invoice.cfeType),
      cfeType: invoice.cfeType,
      currency: invoice.currency,
      hasPdf: invoice.billerId !== null,
      id: invoice.id,
      issueDate: isoDate(invoice.issueDate),
      lines: (items ?? []).map((item, index) => ({
        cantidad: item.cantidad,
        concepto: item.concepto,
        index,
        subtotal: getLineSubtotal(item),
        taxRate: getTaxRate(item.indicador_facturacion),
      })),
      name: getReceiverName(receiver),
      number: invoice.number,
      // El mes de "Emitidas" donde está la factura, para volver.
      periodKey: getBillingPeriodKey(invoice.issueDate ? getPeriodOfIssueDate(invoice.issueDate) : invoice.period),
      receiverDocument: receiver?.documento ?? null,
      series: invoice.series,
      status: invoice.status,
      total,
    },
    noteLabel: noteType ? getCfeLabel(noteType) : null,
    notes: noteStates.map((note) => ({
      billerStatus: note.billerStatus,
      cfeLabel: getCfeLabel(note.cfeType),
      error: note.error,
      id: note.id,
      issueDate: isoDate(note.issueDate),
      number: note.number,
      reason: note.referenceReason,
      series: note.series,
      status: note.status,
      total: note.total,
    })),
    remaining: state.remaining,
  };
};

export type CreditNoteView = NonNullable<Awaited<ReturnType<typeof getCreditNoteView>>>;
