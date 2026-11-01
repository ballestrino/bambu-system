import type { InvoiceItemPayload, InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { compact, formatBillerDate, toCliente, type IssuePayload } from "@/lib/billing/issue-payload";
import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";

// La factura que corrige la nota, como la guarda Invoice.references.
export type CreditNoteReference = {
  billerId: number;
  cfeType: number;
  issueDate: Date | null;
  number: number;
  series: string | null;
};

export type CreditNoteInput = {
  cfeType: number;
  currency: string;
  internalNumber: string;
  items: InvoiceItemPayload[];
  paymentForm: number | null;
  reason: string;
  receiver: InvoiceReceiverPayload | null;
  reference: CreditNoteReference;
};

// SIN PROBAR contra Biller (2026-11-01): la documentación no se pudo leer
// desde el entorno. Se manda la referencia con la misma forma en que
// `detalle` devuelve `referencias` (como pasa con `cliente` e `items`). Si
// Biller la rechaza, el 422 dice qué campo y la nota no se emite: se corrige
// solo esta función. Verificar en Biller test antes de cerrar la feature 43.
export const toBillerReference = (reference: CreditNoteReference) =>
  compact({
    tipo_comprobante: reference.cfeType,
    serie: reference.series,
    numero: reference.number,
    fecha_emision: reference.issueDate ? formatBillerDate(reference.issueDate) : null,
  });

// Una nota de crédito (102 de un e-Ticket, 112 de una e-Factura) se emite con
// `emitir`, el mismo receptor y la referencia a la factura que corrige, tanto
// por el total como parcial, con la forma de pago de la factura y la fecha del
// día.
export const buildCreditNotePayload = (input: CreditNoteInput, issueDate: Date): IssuePayload => {
  const receiver = input.receiver;
  return {
    cliente: receiver?.documento || receiver?.razon_social || receiver?.nombre_fantasia ? toCliente(receiver) : "-",
    fecha_emision: formatBillerDate(issueDate),
    forma_pago: input.paymentForm ?? PAYMENT_FORM.CASH,
    items: input.items.map((item) => compact({ ...item })),
    moneda: input.currency,
    montos_brutos: 0,
    numero_interno: input.internalNumber,
    razon_referencia: input.reason,
    referencias: [toBillerReference(input.reference)],
    tipo_comprobante: input.cfeType,
  };
};
