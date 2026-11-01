import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import { getDefaultDueDay } from "@/lib/billing/invoice-dates";
import type { InvoiceItemPayload, InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { getItemsSubtotal, getItemsTotal, getLineSubtotal, getTaxRate } from "@/lib/billing/invoice-totals";

// Nueva factura (feature 45, docs/billing.md). Puro: lo usan la página, para
// mostrar el resumen y lo que falta, y la acción, que vuelve a validar lo
// mismo antes de emitir o guardar en el borrador.
export const NEW_INVOICE_TYPES = [111, 101] as const;
export const NEW_INVOICE_CURRENCIES = ["UYU", "USD"] as const;
export const RUT_DOCUMENT = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
// Biller: la fecha de emisión puede ir hasta dos meses a futuro.
const MAX_FUTURE_DAYS = 59;

export type NewInvoiceItem = {
  cantidad: string;
  codigo: string;
  concepto: string;
  descripcion: string;
  descuento: string;
  descuentoTipo: "%" | "$";
  indicador: number;
  precio: string;
  recargo: string;
  recargoTipo: "%" | "$";
  unidad: string;
};

export type NewInvoiceForm = {
  address: string;
  cfeType: (typeof NEW_INVOICE_TYPES)[number];
  city: string;
  consumer: boolean;
  country: string;
  currency: (typeof NEW_INVOICE_CURRENCIES)[number];
  department: string;
  document: string;
  documentType: number;
  dueDate: string;
  emails: string[];
  issueDate: string;
  items: NewInvoiceItem[];
  name: string;
  paymentForm: number;
  purchaseOrder: string;
  tradeName: string;
  adenda: string;
};

export const emptyNewInvoiceItem = (indicador: number): NewInvoiceItem => ({
  cantidad: "1", codigo: "", concepto: "", descripcion: "", descuento: "", descuentoTipo: "%", indicador,
  precio: "", recargo: "", recargoTipo: "%", unidad: "",
});

// A crédito, con vencimiento el 10 del mes de emisión o a 5 días si se emite
// después del 10 (feature 50). `issueDay` es la emisión por defecto: hoy, o
// el 1 del mes si se factura un mes que no empezó (getDefaultIssueDay).
export const newInvoiceDefaults = (issueDay: string, indicator: number): NewInvoiceForm => ({
  address: "", cfeType: 111, city: "", consumer: false, country: "UY", currency: "UYU", department: "Montevideo",
  document: "", documentType: RUT_DOCUMENT, dueDate: getDefaultDueDay(issueDay), emails: [], issueDate: issueDay,
  items: [emptyNewInvoiceItem(indicator)], name: "", paymentForm: PAYMENT_FORM.CREDIT, purchaseOrder: "", tradeName: "", adenda: "",
});

// "1.234,50", "1234.5", "10.000" o "$ 2.400" (como parseMoneyInput de la
// página: un punto seguido de tres dígitos separa miles). null si no se
// entiende.
export const parseDecimal = (text: string) => {
  const clean = text.replace(/[$\s]|US/g, "");
  if (!clean) return null;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(clean)
      ? clean.replace(/\./g, "")
      : clean;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
};

const toDay = (text: string) => (/^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00Z`) : null);
const isBlankItem = (item: NewInvoiceItem) => !item.concepto.trim() && !item.precio.trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toItemPayload = (item: NewInvoiceItem): InvoiceItemPayload => {
  const discount = parseDecimal(item.descuento) ?? 0;
  const surcharge = parseDecimal(item.recargo) ?? 0;
  return {
    cantidad: parseDecimal(item.cantidad) ?? 0,
    codigo: item.codigo.trim() || null,
    concepto: item.concepto.trim(),
    descripcion: item.descripcion.trim() || null,
    indicador_facturacion: item.indicador,
    precio: parseDecimal(item.precio) ?? 0,
    unidad_medida: item.unidad.trim() || null,
    ...(discount > 0 ? { descuento_cantidad: discount, descuento_tipo: item.descuentoTipo } : {}),
    ...(surcharge > 0 ? { recargo_cantidad: surcharge, recargo_tipo: item.recargoTipo } : {}),
  };
};

export const getNewInvoiceItems = (form: NewInvoiceForm) => form.items.filter((item) => !isBlankItem(item)).map(toItemPayload);

// RUT y NIFE llevan razón social; CI, pasaporte y DNI se nombran con el nombre
// de fantasía (lo que pide Biller), así que va en los dos.
export const getNewInvoiceReceiver = (form: NewInvoiceForm): InvoiceReceiverPayload | null => {
  if (form.consumer && form.cfeType === 101) return null;
  const company = form.documentType === RUT_DOCUMENT || form.documentType === 7;
  const name = form.name.trim();
  return {
    documento: form.document.replace(/[\s.-]/g, "") || null,
    nombre_fantasia: form.tradeName.trim() || (company ? null : name.slice(0, 30)) || null,
    razon_social: name || null,
    sucursal: {
      ciudad: form.city.trim() || null,
      departamento: form.department.trim() || null,
      direccion: form.address.trim() || null,
      emails: form.emails.length ? form.emails : undefined,
      pais: form.country || "UY",
    },
    tipo_documento: form.documentType,
  };
};

// Días entre la emisión y el vencimiento (crédito), para el borrador.
export const getNewInvoiceDueDays = (form: NewInvoiceForm) => {
  const issue = toDay(form.issueDate);
  const due = toDay(form.dueDate);
  if (form.paymentForm !== PAYMENT_FORM.CREDIT || !issue || !due) return null;
  return Math.max(0, Math.round((due.getTime() - issue.getTime()) / DAY_MS));
};

// Neto, IVA por tasa (22 % y 10 %) y total, como los calcula Biller.
export const getNewInvoiceTotals = (form: NewInvoiceForm) => {
  const items = getNewInvoiceItems(form);
  const byRate = new Map<number, number>();
  for (const item of items) {
    const rate = getTaxRate(item.indicador_facturacion);
    if (rate > 0) byRate.set(rate, (byRate.get(rate) ?? 0) + getLineSubtotal(item) * rate);
  }
  const taxes = [...byRate.entries()].sort((a, b) => b[0] - a[0]).map(([rate, amount]) => ({ amount: Math.round(amount * 100) / 100, rate }));
  return { subtotal: getItemsSubtotal(items), taxes, total: getItemsTotal(items) };
};

// Lo que falta para emitir o guardar, en el orden del formulario. `today` es
// el día de hoy en Montevideo (aaaa-mm-dd).
export const getNewInvoiceProblems = (form: NewInvoiceForm, today: string) => {
  const problems: string[] = [];
  const issue = toDay(form.issueDate);
  const now = toDay(today);
  if (!issue) problems.push("Falta la fecha de emisión.");
  else if (now && issue.getTime() > now.getTime() + MAX_FUTURE_DAYS * DAY_MS) problems.push("La fecha de emisión va hasta dos meses a futuro.");
  if (form.paymentForm === PAYMENT_FORM.CREDIT) {
    const due = toDay(form.dueDate);
    if (!due) problems.push("A crédito necesita vencimiento.");
    else if (issue && due < issue) problems.push("El vencimiento no puede ser antes de la emisión.");
  }
  const document = form.document.replace(/\D/g, "");
  if (form.cfeType === 111 && (form.documentType !== RUT_DOCUMENT || document.length !== 12)) {
    problems.push("La e-Factura va solo con un RUT de 12 dígitos.");
  }
  if (!(form.consumer && form.cfeType === 101) && !form.name.trim()) problems.push("Falta el nombre del cliente.");
  if (form.emails.some((email) => !EMAIL.test(email))) problems.push("Hay un email que no es válido.");
  const items = form.items.filter((item) => !isBlankItem(item));
  if (items.some((item) => !item.concepto.trim())) problems.push("Hay un ítem con precio y sin concepto.");
  if (items.some((item) => !((parseDecimal(item.cantidad) ?? 0) > 0) || (parseDecimal(item.precio) ?? -1) < 0)) {
    problems.push("Hay un ítem sin cantidad o con un precio que no se entiende.");
  }
  if (!getNewInvoiceItems(form).some((item) => item.concepto && getLineSubtotal(item) > 0)) {
    problems.push("Falta al menos un ítem con concepto y precio.");
  }
  return problems;
};
