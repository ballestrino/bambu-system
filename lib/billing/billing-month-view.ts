import type { InvoiceStatus } from "@prisma/client";

import type { DraftJobInfo } from "@/lib/billing/receiver-job-store";
import { getPaymentForm, getRepeatSkip, PAYMENT_FORM, type RepeatContext, type RepeatSkip, type RepeatSource } from "@/lib/billing/draft-repeat";
import { resolveDraftDates } from "@/lib/billing/invoice-dates";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getReceiverDisplay } from "@/lib/billing/invoice-label";
import { getCfeLabel } from "@/lib/billing/invoice-mapping";
import { getItemsSubtotal, getLineSubtotal, hasTaxedItems } from "@/lib/billing/invoice-totals";

type Amount = number | string | { toString(): string };
const toNumber = (value: Amount) => Number(value.toString());

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
  consumer: boolean;
  currency: string;
  document: string | null;
  error: string | null;
  hasPdf: boolean;
  id: string;
  // El trabajo vinculado al receptor con sus avisos, o el que se le parece
  // (feature 43). Lo completa getBillingMonthView.
  jobLink: DraftJobInfo | null;
  // Título interno de un consumidor final (51) y la pista de la adenda.
  label: string | null;
  labelHint: string | null;
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

// "Crédito · vence 10/11" (la fecha con que sale o salió) o "Contado".
export const getPaymentLabel = (paymentForm: number, dueDate: Date | null) =>
  paymentForm === PAYMENT_FORM.CREDIT
    ? dueDate ? `Crédito · vence ${dueDate.getUTCDate()}/${dueDate.getUTCMonth() + 1}` : "Crédito"
    : "Contado";

export const toDraftRow = (
  invoice: {
    adenda?: string | null; billerId: number | null; billerStatus: string | null; cfeType: number; currency: string;
    dueDate?: Date | null; error: string | null; id: string; issueDate?: Date | null; items: unknown; label?: string | null; number: number | null;
    paymentForm: number | null; receiver: unknown; selected: boolean; series: string | null; status: InvoiceStatus;
    total: Amount; updatedAt: Date;
  },
  source: RepeatSource | null,
  context: RepeatContext,
  // Hoy en Montevideo: la fecha con que saldría una del borrador (50).
  today: Date
): DraftRow => {
  const items = readStoredItems(invoice.items) ?? [];
  const receiver = readStoredReceiver(invoice.receiver);
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
  const dueDate =
    invoice.status === "DRAFT"
      ? resolveDraftDates({ explicitDue: invoice.dueDate ?? null, explicitIssue: invoice.issueDate ?? null, paymentForm, period: context.to, today }).dueDate
      : invoice.dueDate ?? null;
  return {
    billerStatus: invoice.billerStatus,
    cfeLabel: getCfeLabel(invoice.cfeType),
    cfeType: invoice.cfeType,
    ...getReceiverDisplay(receiver, invoice.label, invoice.adenda),
    currency: invoice.currency,
    document: receiver?.documento ?? null,
    error: invoice.error,
    hasPdf: invoice.billerId !== null,
    id: invoice.id,
    jobLink: null,
    lines,
    number: invoice.number,
    paymentLabel: getPaymentLabel(paymentForm, dueDate),
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
