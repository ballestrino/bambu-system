import type { InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import { getDefaultDueDay } from "@/lib/billing/invoice-dates";
import { CFE_LABELS, formatInvoiceMoney } from "@/lib/billing/new-invoice-agent-context";
import { emptyNewInvoiceItem, RUT_DOCUMENT, type NewInvoiceForm, type NewInvoiceItem } from "@/lib/billing/new-invoice";
import { INVOICE_FORM_DOCUMENT_TYPES, type FillInvoiceFormInput } from "@/schemas/agent-invoice-form-tools";

// fillInvoiceForm (feature 46): de lo que pide el agente a los campos que
// cambian en el formulario de Nueva factura. Puro: no escribe nada; la página
// aplica el `patch` y la persona revisa y emite.
const DAY_MS = 24 * 60 * 60 * 1000;

export const addInvoiceDays = (day: string, days: number) =>
  new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

// Los datos de un cliente de una factura anterior, como los carga "Buscar
// cliente" en la página. Los emails no: Biller ya tiene los del cliente.
export const receiverToNewInvoiceForm = (receiver: InvoiceReceiverPayload): Partial<NewInvoiceForm> => ({
  address: receiver.sucursal.direccion ?? "",
  city: receiver.sucursal.ciudad ?? "",
  consumer: false,
  country: receiver.sucursal.pais || "UY",
  department: receiver.sucursal.departamento ?? "",
  document: receiver.documento ?? "",
  documentType: receiver.tipo_documento ?? RUT_DOCUMENT,
  name: receiver.razon_social || receiver.nombre_fantasia || "",
  tradeName: receiver.nombre_fantasia ?? "",
});

// Un RUT consultado en DGI: razón social y domicilio fiscal.
export type RutData = { address: string | null; city: string | null; department: string | null; name: string | null };

export const rutToNewInvoiceForm = (rut: string, data: RutData): Partial<NewInvoiceForm> => ({
  address: data.address ?? "",
  city: data.city ?? "",
  consumer: false,
  department: data.department ?? "",
  document: rut,
  documentType: RUT_DOCUMENT,
  name: data.name ?? "",
  tradeName: "",
});

// Un número para un campo de texto del formulario, como lo escribe la gente
// en Uruguay: coma decimal y sin separador de miles (parseDecimal lo lee).
export const toFormNumber = (value: number) => String(Math.round(value * 100) / 100).replace(".", ",");

const toItem = (item: NonNullable<FillInvoiceFormInput["items"]>[number], indicator: number): NewInvoiceItem => ({
  ...emptyNewInvoiceItem(item.indicador ?? indicator),
  cantidad: toFormNumber(item.cantidad ?? 1),
  concepto: item.concepto,
  descripcion: item.descripcion ?? "",
  precio: toFormNumber(item.precio),
  unidad: item.unidad ?? "",
});

const FIELD_LABELS: Partial<Record<keyof NewInvoiceForm, string>> = {
  address: "dirección", city: "ciudad", department: "departamento", document: "documento", documentType: "tipo de documento",
  emails: "emails", name: "nombre", tradeName: "nombre de fantasía", purchaseOrder: "orden de compra", adenda: "adenda",
};

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export type InvoiceFormFill = { form: NewInvoiceForm; patch: Partial<NewInvoiceForm>; changes: string[] };

// `found` son los datos del cliente que trajo clientDocument (factura
// anterior o DGI). Lo escrito en `client` los pisa. El indicador por defecto
// es el de la primera línea del formulario (el de la última factura emitida).
export const planInvoiceFormFill = (
  current: NewInvoiceForm,
  input: FillInvoiceFormInput,
  found: { label: string; fields: Partial<NewInvoiceForm> } | null
): InvoiceFormFill => {
  const next: NewInvoiceForm = { ...current };
  const changes: string[] = [];
  const set = <K extends keyof NewInvoiceForm>(key: K, value: NewInvoiceForm[K]) => {
    next[key] = value;
  };

  if (input.cfeType) {
    const cfeType = input.cfeType === "e-Factura" ? 111 : 101;
    set("cfeType", cfeType);
    if (cfeType === 111) {
      set("consumer", false);
      set("documentType", RUT_DOCUMENT);
    }
  }
  if (input.issueDate) set("issueDate", input.issueDate);
  if (input.payment) set("paymentForm", input.payment === "credito" ? PAYMENT_FORM.CREDIT : PAYMENT_FORM.CASH);
  // Como la página (50): con los días que pidió el usuario o, si no, el 10
  // del mes de emisión (a 5 días si se emite después del 10). Un vencimiento
  // que seguía la regla se mueve con la emisión; uno elegido se respeta.
  if (next.paymentForm === PAYMENT_FORM.CREDIT && next.issueDate) {
    const followsRule = !next.dueDate || next.dueDate < next.issueDate || current.dueDate === getDefaultDueDay(current.issueDate);
    if (input.creditDays !== null) set("dueDate", addInvoiceDays(next.issueDate, input.creditDays));
    else if (followsRule) set("dueDate", getDefaultDueDay(next.issueDate));
  }
  if (input.currency) set("currency", input.currency);
  if (input.purchaseOrder !== null) set("purchaseOrder", input.purchaseOrder);
  if (found) {
    Object.assign(next, found.fields);
    changes.push(`Cliente ${found.fields.name || found.fields.document} (${found.label})`);
  }
  if (input.consumer !== null) set("consumer", input.consumer && next.cfeType === 101);

  const typed: string[] = [];
  const client = input.client;
  if (client) {
    if (client.documentType) set("documentType", INVOICE_FORM_DOCUMENT_TYPES[client.documentType]);
    const fields = ["document", "name", "tradeName", "address", "city", "department"] as const;
    for (const field of fields) if (client[field] !== null) set(field, client[field]!);
    if (client.emails) set("emails", client.emails);
    for (const key of ["documentType", ...fields, "emails"] as const) {
      if ((key === "emails" ? client.emails : client[key]) !== null && !sameValue(next[key], current[key])) typed.push(FIELD_LABELS[key]!);
    }
  }
  if (typed.length) changes.push(`Cliente: ${typed.join(", ")}`);

  if (input.items) {
    const indicator = current.items[0]?.indicador ?? 3;
    set("items", input.items.map((item) => toItem(item, indicator)));
    const lines = input.items.map((item) => `${item.concepto} ${formatInvoiceMoney((item.cantidad ?? 1) * item.precio, next.currency)}`);
    changes.push(`Ítems: ${lines.join("; ")} (sin IVA)`);
  }
  if (input.adenda !== null) set("adenda", input.adenda);

  const patch: Partial<NewInvoiceForm> = {};
  for (const key of Object.keys(next) as (keyof NewInvoiceForm)[]) {
    if (!sameValue(next[key], current[key])) Object.assign(patch, { [key]: next[key] });
  }
  // Lo que cambió del comprobante y la adenda, en palabras (el cliente y los
  // ítems ya están arriba).
  if ("cfeType" in patch) changes.unshift(`Tipo ${CFE_LABELS[next.cfeType]}`);
  if ("issueDate" in patch) changes.push(`Emisión ${next.issueDate}`);
  if ("paymentForm" in patch || "dueDate" in patch) {
    changes.push(next.paymentForm === PAYMENT_FORM.CREDIT ? `Crédito, vence ${next.dueDate}` : "Contado");
  }
  if ("currency" in patch) changes.push(`Moneda ${next.currency}`);
  if ("consumer" in patch) changes.push(next.consumer ? "Consumidor final" : "Con datos del cliente");
  for (const key of ["purchaseOrder", "adenda"] as const) {
    if (key in patch) changes.push(next[key] ? `${FIELD_LABELS[key]!.charAt(0).toUpperCase()}${FIELD_LABELS[key]!.slice(1)}: ${next[key]}` : `Sin ${FIELD_LABELS[key]}`);
  }
  return { changes, form: next, patch };
};
