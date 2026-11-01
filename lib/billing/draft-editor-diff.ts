import { moveMonthInText } from "@/lib/billing/billing-month-text";
import { describeItemChanges, type DraftEditorInvoice } from "@/lib/billing/draft-editor";
import { getPaymentForm, moveItemsMonth, PAYMENT_FORM, type RepeatSource } from "@/lib/billing/draft-repeat";
import { getReceiverName } from "@/lib/billing/invoice-json";
import { getCfeLabel } from "@/lib/billing/invoice-mapping";

// "Contra el mes pasado" del editor lateral (49): qué cambió la factura del
// borrador frente a la que repite. El mes del texto ("octubre 2026" →
// "noviembre 2026") se mueve solo al repetir: no cuenta como cambio. Puro.
export const describeSourceChanges = (current: DraftEditorInvoice, source: RepeatSource, months: { from: Date; to: Date }) => {
  const notes: string[] = [];
  if (source.cfeType !== current.cfeType) notes.push(`Tipo ${getCfeLabel(source.cfeType)} → ${getCfeLabel(current.cfeType)}`);
  if (source.currency !== current.currency) notes.push(`Moneda ${source.currency} → ${current.currency}`);
  const before = getPaymentForm(source);
  if (before !== current.paymentForm) notes.push(current.paymentForm === PAYMENT_FORM.CREDIT ? "Contado → Crédito" : "Crédito → Contado");

  const sourceName = getReceiverName(source.receiver);
  const currentName = getReceiverName(current.receiver);
  if (sourceName !== currentName) notes.push(`Cliente ${sourceName} → ${currentName}`);
  else if ((source.receiver?.documento ?? null) !== (current.receiver?.documento ?? null)) notes.push("Documento del cliente cambiado");

  const sourceItems = moveItemsMonth(source.items ?? [], months.from, months.to);
  notes.push(...describeItemChanges(sourceItems, current.items ?? [], current.currency));

  const sourceAdenda = source.adenda ? moveMonthInText(source.adenda, months.from, months.to) : null;
  if ((sourceAdenda?.trim() || null) !== (current.adenda?.trim() || null)) notes.push(current.adenda ? "Adenda cambiada" : "Sin adenda");
  return notes;
};
