import type { InvoiceStatus } from "@prisma/client";

import { classifyCfe, type InvoiceItemPayload } from "@/lib/billing/invoice-mapping";
import { getItemsSubtotal, getItemsTotal, getLineSubtotal } from "@/lib/billing/invoice-totals";

// Nota de crédito de una factura emitida (feature 43, docs/billing.md). Puro:
// lo usan la página, la acción que emite y el agente, que solo la prepara.
export const CREDIT_NOTE_TYPE: Record<number, number> = { 101: 102, 111: 112 };

// DGI admite hasta 90 caracteres en la razón de la referencia.
export const CREDIT_REASON_MAX = 90;

const ISSUED = new Set<InvoiceStatus>(["ISSUED", "ACCEPTED"]);
const IN_FLIGHT = new Set<InvoiceStatus>(["ISSUING", "UNKNOWN"]);
const TOLERANCE = 0.01;
// El total de Biller redondea por línea: unos centavos de diferencia no frenan.
const TOTAL_TOLERANCE = 1;

const round = (amount: number) => Math.round(amount * 100) / 100;

export type CreditableInvoice = {
  billerId: number | null;
  cfeType: number;
  items: InvoiceItemPayload[] | null;
  number: number | null;
  status: InvoiceStatus;
  total: number;
};

// Una nota que ya apunta a la factura (de Biller o de Bambú).
export type ExistingNote = { cfeType: number; status: InvoiceStatus; total: number };

export type CreditNoteRequest =
  | { mode: "full" }
  | { lines: { amount: number; index: number }[]; mode: "partial" };

// Lo acreditado con notas emitidas (las rechazadas no cuentan), si hay una
// en curso o sin confirmar, y lo que queda por acreditar (con IVA).
export const getCreditState = (invoice: Pick<CreditableInvoice, "total">, notes: ExistingNote[]) => {
  const credit = notes.filter((note) => classifyCfe(note.cfeType) === "credit_note");
  const credited = round(credit.filter((note) => ISSUED.has(note.status)).reduce((sum, note) => sum + note.total, 0));
  const remaining = round(Math.max(0, invoice.total - credited));
  return {
    credited,
    fully: credited > 0 && remaining <= TOLERANCE,
    inFlight: credit.some((note) => IN_FLIGHT.has(note.status)),
    remaining,
  };
};

export type CreditNotePlan =
  | { cfeType: number; items: InvoiceItemPayload[]; ok: true; subtotal: number; total: number }
  | { error: string; ok: false };

const fail = (error: string): CreditNotePlan => ({ error, ok: false });

// Por qué una factura no admite una nota de crédito ahora (null: la admite).
export const getCreditBlocker = (invoice: CreditableInvoice, notes: ExistingNote[]) => {
  if (!CREDIT_NOTE_TYPE[invoice.cfeType]) return "Solo una e-Factura o un e-Ticket llevan nota de crédito";
  if (!ISSUED.has(invoice.status) || invoice.billerId === null || invoice.number === null) {
    return "La factura todavía no está emitida en Biller";
  }
  if (!invoice.items?.length) return "Faltan las líneas de la factura: actualizá el mes para leerlas de Biller";
  const state = getCreditState(invoice, notes);
  if (state.inFlight) return "Hay una nota de crédito de esta factura sin confirmar";
  if (state.fully) return "La factura ya está anulada";
  return null;
};

// Por el total copia las líneas tal cual (anula la factura). Parcial acredita
// un monto sin IVA por línea, con el concepto y el indicador de la línea, sin
// pasar el subtotal de la línea ni lo que queda de la factura.
export const planCreditNote = (
  invoice: CreditableInvoice,
  notes: ExistingNote[],
  request: CreditNoteRequest
): CreditNotePlan => {
  const blocker = getCreditBlocker(invoice, notes);
  if (blocker) return fail(blocker);
  const source = invoice.items ?? [];
  const state = getCreditState(invoice, notes);
  const cfeType = CREDIT_NOTE_TYPE[invoice.cfeType];

  if (request.mode === "full") {
    if (state.credited > 0) return fail("La factura ya tiene una nota parcial: hacé otra parcial por lo que queda");
    const items = source.map((item) => ({ ...item }));
    return { cfeType, items, ok: true, subtotal: getItemsSubtotal(items), total: getItemsTotal(items) };
  }

  const seen = new Set<number>();
  const items: InvoiceItemPayload[] = [];
  for (const line of request.lines) {
    const item = source[line.index];
    if (!item || seen.has(line.index)) return fail("Una línea de la nota no está en la factura");
    seen.add(line.index);
    if (!(line.amount > 0)) continue;
    if (line.amount > getLineSubtotal(item) + TOLERANCE) {
      return fail(`"${item.concepto}" no puede acreditar más que su subtotal`);
    }
    items.push({
      cantidad: 1,
      codigo: item.codigo,
      concepto: item.concepto,
      descripcion: null,
      indicador_facturacion: item.indicador_facturacion,
      precio: round(line.amount),
      unidad_medida: item.unidad_medida,
    });
  }
  if (!items.length) return fail("Poné el monto a acreditar en al menos una línea");
  const total = getItemsTotal(items);
  if (total > state.remaining + TOTAL_TOLERANCE) return fail("La nota supera lo que queda por acreditar de la factura");
  return { cfeType, items, ok: true, subtotal: getItemsSubtotal(items), total };
};
