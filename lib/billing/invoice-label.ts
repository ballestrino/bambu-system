import { getReceiverName, isConsumerReceiver } from "@/lib/billing/invoice-json";
import type { InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";

// El título interno de una factura (feature 51): nombra a un consumidor
// final dentro de Bambú. No va a Biller ni al PDF.
export const INVOICE_LABEL_MAX = 60;

// Espacios de más afuera; vacío es sin título.
export const cleanInvoiceLabel = (value: string | null | undefined) => {
  const label = value?.replace(/\s+/g, " ").trim() ?? "";
  return label ? label.slice(0, INVOICE_LABEL_MAX) : null;
};

const MONTH_TEXT = /\b(correspondiente|enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\b/i;

// Una pista para el campo, sin guardarla: la última parte de la adenda que
// no habla del mes, que suele ser la dirección ("Godoy 4548").
export const getLabelHint = (adenda: string | null | undefined) => {
  const parts = (adenda ?? "")
    .split(/\r?\n| - /)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length >= 3 && !MONTH_TEXT.test(part));
  const hint = parts.at(-1);
  return hint ? hint.slice(0, INVOICE_LABEL_MAX) : null;
};

// Lo que muestra una fila del receptor: el nombre (con el título si es un
// consumidor final), si lleva título y la pista de la adenda.
export const getReceiverDisplay = (receiver: InvoiceReceiverPayload | null, label: string | null | undefined, adenda: string | null | undefined) => ({
  consumer: isConsumerReceiver(receiver),
  label: label ?? null,
  labelHint: getLabelHint(adenda),
  name: getReceiverName(receiver, label),
});
