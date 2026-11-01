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

// Biller acepta la referencia como el ID del comprobante en Biller, como
// `{ tipo, serie, numero }` o, si no se emitió en Biller, con `fecha`
// (api-docs, "Referencia"). La nota solo sale de una factura emitida en Biller
// (getCreditBlocker pide billerId), así que va el ID. La forma de lectura de
// `detalle` (tipo_comprobante, fecha_emision) no sirve para emitir.
export const toBillerReference = (reference: CreditNoteReference) => reference.billerId;

// Una nota de crédito (102 de un e-Ticket, 112 de una e-Factura) se emite con
// `emitir`, el mismo receptor y la referencia a la factura que corrige, tanto
// por el total como parcial, con la forma de pago de la factura y la fecha del
// día. `razon_referencia` es de la referencia global: con referencias
// puntuales Biller pide `referencia_global` y no lo acepta en 0 (probado en
// test el 2026-11-01), así que la razón va en la adenda y sale en el PDF.
export const buildCreditNotePayload = (input: CreditNoteInput, issueDate: Date): IssuePayload => {
  const receiver = input.receiver;
  return {
    adenda: input.reason,
    cliente: receiver?.documento || receiver?.razon_social || receiver?.nombre_fantasia ? toCliente(receiver) : "-",
    fecha_emision: formatBillerDate(issueDate),
    forma_pago: input.paymentForm ?? PAYMENT_FORM.CASH,
    items: input.items.map((item) => compact({ ...item })),
    moneda: input.currency,
    montos_brutos: 0,
    numero_interno: input.internalNumber,
    referencias: [toBillerReference(input.reference)],
    tipo_comprobante: input.cfeType,
  };
};
