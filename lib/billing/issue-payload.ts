import { BILLING_TIME_ZONE } from "@/lib/billing/billing-month";
import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import { classifyCfe, type InvoiceItemPayload, type InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { getLocalDateTime } from "@/lib/ops/timezone";

// Lo que se manda a emitir (docs/billing.md, "Formulario de factura"). La
// sucursal la agrega el emisor desde la configuración.
export type IssuePayload = {
  adenda?: string;
  cliente: Record<string, unknown> | "-";
  fecha_emision: string;
  fecha_vencimiento?: string;
  forma_pago: number;
  items: Record<string, unknown>[];
  moneda: string;
  montos_brutos: 0;
  numero_interno: string;
  razon_referencia?: string;
  referencias?: Record<string, unknown>[];
  tipo_comprobante: number;
};

export type IssueInput = {
  adenda: string | null;
  cfeType: number;
  currency: string;
  dueDays: number | null;
  internalNumber: string | null;
  items: InvoiceItemPayload[] | null;
  paymentForm: number | null;
  receiver: InvoiceReceiverPayload | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RUT_DOCUMENT = 2;
const E_FACTURA_TYPES = new Set([111, 112, 113]);

// La fecha de emisión es el día en que se emite, en Montevideo, como Date UTC
// del día (lo que guarda una columna @db.Date).
export const getIssueDay = (now: Date) => {
  const local = getLocalDateTime(now, BILLING_TIME_ZONE);
  return new Date(Date.UTC(local.year, local.month - 1, local.day));
};

const pad = (value: number) => String(value).padStart(2, "0");

// Biller acepta dd/mm/aaaa (lo que pide la documentación) y aaaa-mm-dd.
export const formatBillerDate = (day: Date) =>
  `${pad(day.getUTCDate())}/${pad(day.getUTCMonth() + 1)}/${day.getUTCFullYear()}`;

export const addDays = (day: Date, days: number) => new Date(day.getTime() + days * DAY_MS);

// Biller arma XML: un null o un texto vacío no se mandan.
export const compact = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== null && field !== undefined && field !== ""));

export const toCliente = (receiver: InvoiceReceiverPayload) => {
  const sucursal = compact(receiver.sucursal);
  return compact({
    tipo_documento: receiver.tipo_documento,
    documento: receiver.documento?.replace(/[\s.-]/g, ""),
    razon_social: receiver.razon_social,
    nombre_fantasia: receiver.nombre_fantasia,
    sucursal: Object.keys(sucursal).length ? sucursal : { pais: "UY" },
  });
};

export type IssuePlan =
  | { dueDate: Date | null; issueDate: Date; ok: true; paymentForm: number; payload: IssuePayload }
  | { error: string; ok: false };

// Lo que falta se dice antes de llamar a Biller, como en el formulario: una
// e-Factura solo con RUT de 12 dígitos y al menos un ítem con precio. Una
// nota repetida del mes pasado no sale del borrador: necesita la factura que
// corrige, y eso se hace desde la nota de crédito (43).
export const buildIssuePlan = (input: IssueInput, issueDate: Date): IssuePlan => {
  if (classifyCfe(input.cfeType) !== "invoice") {
    return { error: "Las notas de crédito y débito no se emiten desde el borrador", ok: false };
  }
  if (!input.internalNumber) return { error: "La factura no tiene número interno", ok: false };
  const items = input.items ?? [];
  if (!items.length) return { error: "La factura no tiene ítems", ok: false };
  if (!items.some((item) => item.cantidad * item.precio > 0)) return { error: "La factura no tiene montos", ok: false };

  const receiver = input.receiver;
  const document = receiver?.documento?.replace(/\D/g, "") ?? "";
  if (E_FACTURA_TYPES.has(input.cfeType) && (receiver?.tipo_documento !== RUT_DOCUMENT || document.length !== 12)) {
    return { error: "Una e-Factura necesita un RUT de 12 dígitos", ok: false };
  }

  const paymentForm = input.paymentForm ?? PAYMENT_FORM.CASH;
  const dueDate = paymentForm === PAYMENT_FORM.CREDIT && input.dueDays ? addDays(issueDate, input.dueDays) : null;

  return {
    dueDate,
    issueDate,
    ok: true,
    paymentForm,
    payload: {
      ...(input.adenda ? { adenda: input.adenda } : {}),
      cliente: receiver?.documento || receiver?.razon_social || receiver?.nombre_fantasia ? toCliente(receiver) : "-",
      fecha_emision: formatBillerDate(issueDate),
      ...(dueDate ? { fecha_vencimiento: formatBillerDate(dueDate) } : {}),
      forma_pago: paymentForm,
      items: items.map((item) => compact({ ...item })),
      moneda: input.currency,
      montos_brutos: 0,
      numero_interno: input.internalNumber,
      tipo_comprobante: input.cfeType,
    },
  };
};
