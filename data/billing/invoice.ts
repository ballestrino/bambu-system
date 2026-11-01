import "server-only";

import { getReceiverName, readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getCfeLabel } from "@/lib/billing/invoice-mapping";
import { getItemsSubtotal, getLineSubtotal } from "@/lib/billing/invoice-totals";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

// Una factura de la copia local, entera: lo emitido (con su estado ante DGI y
// las notas que la corrigen) o una del borrador. La lee el agente (getInvoice).
export const getBillingInvoice = async (invoiceId: string) => {
  await requireAdminSession();
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      adenda: true, billerId: true, billerStatus: true, cfeType: true, currency: true, dueDate: true, error: true,
      id: true, internalNumber: true, issueDate: true, items: true, number: true, origin: true, paymentForm: true,
      period: true, receiver: true, references: true, selected: true, series: true, status: true, total: true,
      batch: { select: { id: true, status: true } },
    },
  });
  if (!invoice) return null;

  const notes = invoice.billerId === null
    ? []
    : await db.invoice.findMany({
        where: { referenceIds: { has: invoice.billerId } },
        select: { cfeType: true, id: true, issueDate: true, number: true, series: true, total: true },
      });
  const items = readStoredItems(invoice.items);
  const receiver = readStoredReceiver(invoice.receiver);

  return {
    adenda: invoice.adenda,
    batch: invoice.batch,
    billerStatus: invoice.billerStatus,
    cfeLabel: getCfeLabel(invoice.cfeType),
    cfeType: invoice.cfeType,
    correctedBy: notes.map((note) => ({ ...note, cfeLabel: getCfeLabel(note.cfeType), issueDate: isoDate(note.issueDate), total: Number(note.total) })),
    currency: invoice.currency,
    dueDate: isoDate(invoice.dueDate),
    error: invoice.error,
    id: invoice.id,
    internalNumber: invoice.internalNumber,
    issueDate: isoDate(invoice.issueDate),
    lines: items?.map((item, index) => ({ ...item, index, subtotal: getLineSubtotal(item) })) ?? null,
    name: getReceiverName(receiver),
    number: invoice.number,
    origin: invoice.origin,
    paymentForm: invoice.paymentForm,
    period: invoice.period.toISOString().slice(0, 7),
    receiver,
    references: invoice.references,
    selected: invoice.selected,
    series: invoice.series,
    status: invoice.status,
    subtotal: items ? getItemsSubtotal(items) : null,
    total: Number(invoice.total),
  };
};
