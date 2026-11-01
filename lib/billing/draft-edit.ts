import type { InvoiceItemPayload } from "@/lib/billing/invoice-mapping";
import type { DraftInvoiceEdit } from "@/schemas/billing";

const round = (amount: number) => Math.round(amount * 100) / 100;

// Aplica los cambios de concepto y precio a los ítems de una factura del
// borrador. Una línea que no existe es un error: la página vio otra factura.
export const applyDraftLineEdits = (
  items: InvoiceItemPayload[],
  lines: NonNullable<DraftInvoiceEdit["lines"]>
): InvoiceItemPayload[] | null => {
  if (lines.some((line) => line.index >= items.length)) return null;
  return items.map((item, index) => {
    const edit = lines.find((line) => line.index === index);
    if (!edit) return item;
    return {
      ...item,
      ...(edit.concepto !== undefined ? { concepto: edit.concepto } : {}),
      ...(edit.precio !== undefined ? { precio: round(edit.precio) } : {}),
    };
  });
};
