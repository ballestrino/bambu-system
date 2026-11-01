import type { InvoiceStatus } from "@prisma/client";

import type { InvoiceCredit } from "@/lib/billing/credit-note-links";
import type { DraftJobInfo } from "@/lib/billing/receiver-job-store";
import { CREDIT_NOTE_TYPE } from "@/lib/billing/credit-note-plan";
import { canArchiveInvoice } from "@/lib/billing/invoice-remove";
import { getDueDays, getPaymentForm, getRepeatSkip, PAYMENT_FORM, type RepeatContext, type RepeatSkip, type RepeatSource } from "@/lib/billing/draft-repeat";
import { getReceiverName, readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { classifyCfe, getCfeLabel } from "@/lib/billing/invoice-mapping";
import { getItemsSubtotal, getLineSubtotal, hasTaxedItems } from "@/lib/billing/invoice-totals";

type Amount = number | string | { toString(): string };
const toNumber = (value: Amount) => Number(value.toString());
const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

// Una fila de "Emitidas": lo que hay en Biller con fecha de emisión en el mes.
export type IssuedInvoiceRow = {
  annulled: boolean;
  // Archivada (47): sale de "Emitidas" y sigue en el resumen.
  archivedAt: string | null;
  canArchive: boolean;
  // Si admite una nota de crédito ahora (emitida, sin anular ni una en curso).
  canCredit: boolean;
  // Las notas que la corrigen: lo acreditado, la primera nota y una sin confirmar.
  credit: { credited: number; inFlight: boolean; noteLabel: string | null; unknownNoteId: string | null } | null;
  billerStatus: string | null;
  cfeLabel: string;
  cfeType: number;
  currency: string;
  detail: string | null;
  // RUT o cédula del receptor, para buscar (48).
  document: string | null;
  hasPdf: boolean;
  id: string;
  isNote: boolean;
  issueDate: string | null;
  name: string;
  number: number | null;
  series: string | null;
  status: InvoiceStatus;
  total: number;
};

export const toIssuedRow = (
  invoice: {
    archivedAt?: Date | null; billerId: number | null; billerStatus: string | null; cfeType: number; currency: string; id: string;
    issueDate: Date | null; items: unknown; number: number | null; receiver: unknown; series: string | null;
    status: InvoiceStatus; total: Amount;
  },
  credits: Map<number, InvoiceCredit>
): IssuedInvoiceRow => {
  const credit = invoice.billerId === null ? undefined : credits.get(invoice.billerId);
  return {
    annulled: credit?.fully ?? false,
    archivedAt: invoice.archivedAt?.toISOString() ?? null,
    canArchive: canArchiveInvoice(invoice.status),
    canCredit:
      Boolean(CREDIT_NOTE_TYPE[invoice.cfeType]) && invoice.billerId !== null &&
      (invoice.status === "ISSUED" || invoice.status === "ACCEPTED") && !credit?.fully && !credit?.inFlight,
    credit: credit
      ? { credited: credit.credited, inFlight: credit.inFlight, noteLabel: credit.note?.label ?? null, unknownNoteId: credit.unknownNoteId }
      : null,
    billerStatus: invoice.billerStatus,
    cfeLabel: getCfeLabel(invoice.cfeType),
    cfeType: invoice.cfeType,
    currency: invoice.currency,
    detail: readStoredItems(invoice.items)?.[0]?.concepto ?? null,
    document: readStoredReceiver(invoice.receiver)?.documento ?? null,
    hasPdf: invoice.billerId !== null,
    id: invoice.id,
    isNote: classifyCfe(invoice.cfeType) !== "invoice",
    issueDate: isoDate(invoice.issueDate),
    name: getReceiverName(readStoredReceiver(invoice.receiver)),
    number: invoice.number,
    series: invoice.series,
    status: invoice.status,
    total: toNumber(invoice.total),
  };
};

export type DraftLine = {
  cantidad: number;
  concepto: string;
  precio: number;
  prevPrecio: number | null;
  prevSubtotal: number | null;
  subtotal: number;
  unidad: string | null;
};

// Una factura del borrador, con lo del mes pasado al lado para comparar. Una
// vez emitida trae su serie, número y estado; error es por qué no salió.
export type DraftRow = {
  billerStatus: string | null;
  cfeLabel: string;
  cfeType: number;
  currency: string;
  document: string | null;
  error: string | null;
  hasPdf: boolean;
  id: string;
  // El trabajo vinculado al receptor con sus avisos, o el que se le parece
  // (feature 43). Lo completa getBillingMonthView.
  jobLink: DraftJobInfo | null;
  lines: DraftLine[];
  name: string;
  number: number | null;
  paymentLabel: string;
  prevSubtotal: number | null;
  priceChanged: boolean;
  selected: boolean;
  series: string | null;
  skip: RepeatSkip | null;
  status: InvoiceStatus;
  subtotal: number;
  taxed: boolean;
  total: number;
  updatedAt: string;
};

export const getPaymentLabel = (paymentForm: number, dueDays: number | null) =>
  paymentForm === PAYMENT_FORM.CREDIT ? (dueDays ? `Crédito ${dueDays} días` : "Crédito") : "Contado";

export const toDraftRow = (
  invoice: {
    billerId: number | null; billerStatus: string | null; cfeType: number; currency: string; dueDays?: number | null;
    error: string | null; id: string; items: unknown; number: number | null;
    paymentForm: number | null; receiver: unknown; selected: boolean; series: string | null; status: InvoiceStatus;
    total: Amount; updatedAt: Date;
  },
  source: RepeatSource | null,
  context: RepeatContext
): DraftRow => {
  const items = readStoredItems(invoice.items) ?? [];
  const prevItems = source?.items ?? null;
  const lines = items.map((item, index) => {
    const prev = prevItems?.[index];
    return {
      cantidad: item.cantidad,
      concepto: item.concepto,
      precio: item.precio,
      prevPrecio: prev ? prev.precio : null,
      prevSubtotal: prev ? getLineSubtotal(prev) : null,
      subtotal: getLineSubtotal(item),
      unidad: item.unidad_medida,
    };
  });
  const paymentForm = invoice.paymentForm ?? (source ? getPaymentForm(source) : PAYMENT_FORM.CASH);
  return {
    billerStatus: invoice.billerStatus,
    cfeLabel: getCfeLabel(invoice.cfeType),
    cfeType: invoice.cfeType,
    currency: invoice.currency,
    document: readStoredReceiver(invoice.receiver)?.documento ?? null,
    error: invoice.error,
    hasPdf: invoice.billerId !== null,
    id: invoice.id,
    jobLink: null,
    lines,
    name: getReceiverName(readStoredReceiver(invoice.receiver)),
    number: invoice.number,
    paymentLabel: getPaymentLabel(paymentForm, invoice.dueDays ?? (source ? getDueDays(source) : null)),
    prevSubtotal: prevItems ? getItemsSubtotal(prevItems) : null,
    priceChanged: lines.some((line) => line.prevPrecio !== null && line.prevPrecio !== line.precio),
    selected: invoice.selected,
    series: invoice.series,
    skip: source ? getRepeatSkip(source, context) : null,
    status: invoice.status,
    subtotal: getItemsSubtotal(items),
    taxed: hasTaxedItems(items),
    total: toNumber(invoice.total),
    updatedAt: invoice.updatedAt.toISOString(),
  };
};
