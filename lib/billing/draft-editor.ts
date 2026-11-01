import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import type { InvoiceItemPayload, InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { getItemsTotal } from "@/lib/billing/invoice-totals";
import {
  emptyNewInvoiceItem,
  getNewInvoiceItems,
  getNewInvoiceReceiver,
  NEW_INVOICE_CURRENCIES,
  NEW_INVOICE_TYPES,
  RUT_DOCUMENT,
  type NewInvoiceForm,
  type NewInvoiceItem,
} from "@/lib/billing/new-invoice";
import { receiverToNewInvoiceForm } from "@/lib/billing/new-invoice-agent-fill";

// El editor lateral de una factura del borrador (feature 49, docs/billing.md):
// la factura guardada en el formulario de Nueva factura y de vuelta. Puro: lo
// usan la página y la acción que guarda.
export type DraftEditorInvoice = {
  adenda: string | null;
  cfeType: number;
  currency: string;
  items: InvoiceItemPayload[] | null;
  paymentForm: number;
  purchaseOrder: string | null;
  receiver: InvoiceReceiverPayload | null;
};

const CLIENT_FIELDS = ["address", "city", "consumer", "country", "department", "document", "documentType", "emails", "name", "tradeName"] as const;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Por qué una factura del borrador no se edita en el formulario (null: se edita).
export const getDraftEditorBlock = (invoice: { batchStatus: string | null; cfeType: number; currency: string; status: string }) => {
  if (invoice.status !== "DRAFT" || invoice.batchStatus !== "DRAFT") return "Ya no es un borrador: se emitió o se está emitiendo.";
  if (!(NEW_INVOICE_TYPES as readonly number[]).includes(invoice.cfeType)) return "Las notas de crédito y débito no se emiten desde el borrador.";
  if (!(NEW_INVOICE_CURRENCIES as readonly string[]).includes(invoice.currency)) return `La moneda ${invoice.currency} no se edita acá.`;
  return null;
};

// Un número guardado como lo muestra el formulario, sin redondear: coma decimal.
const toFormDecimal = (value: number | undefined) => (value === undefined ? "" : String(value).replace(".", ","));
const toAdjustType = (value: string | undefined): "%" | "$" => (value === "%" ? "%" : "$");

export const itemToFormItem = (item: InvoiceItemPayload): NewInvoiceItem => ({
  ...emptyNewInvoiceItem(item.indicador_facturacion),
  cantidad: toFormDecimal(item.cantidad),
  codigo: item.codigo ?? "",
  concepto: item.concepto,
  descripcion: item.descripcion ?? "",
  descuento: toFormDecimal(item.descuento_cantidad),
  descuentoTipo: toAdjustType(item.descuento_tipo),
  precio: toFormDecimal(item.precio),
  recargo: toFormDecimal(item.recargo_cantidad),
  recargoTipo: toAdjustType(item.recargo_tipo),
  unidad: item.unidad_medida ?? "",
});

// La factura guardada en el formulario, con las fechas que ya resolvió quien
// llama (las elegidas o las de por defecto). Una factura sin receptor es un
// e-Ticket a consumidor final.
export const draftToForm = (invoice: DraftEditorInvoice, dates: { dueDate: string; issueDate: string }): NewInvoiceForm => {
  const cfeType = invoice.cfeType === 101 ? 101 : 111;
  const receiver = invoice.receiver;
  const items = invoice.items?.length ? invoice.items.map(itemToFormItem) : [emptyNewInvoiceItem(3)];
  return {
    address: "", city: "", country: "UY", department: "", document: "", documentType: RUT_DOCUMENT, name: "", tradeName: "",
    ...(receiver ? receiverToNewInvoiceForm(receiver) : {}),
    adenda: invoice.adenda ?? "",
    cfeType,
    consumer: cfeType === 101 && !receiver,
    currency: invoice.currency === "USD" ? "USD" : "UYU",
    dueDate: invoice.paymentForm === PAYMENT_FORM.CREDIT ? dates.dueDate : "",
    emails: receiver?.sucursal.emails ?? [],
    issueDate: dates.issueDate,
    items,
    paymentForm: invoice.paymentForm === PAYMENT_FORM.CREDIT ? PAYMENT_FORM.CREDIT : PAYMENT_FORM.CASH,
    purchaseOrder: invoice.purchaseOrder ?? "",
  };
};

const sameClient = (a: NewInvoiceForm, b: NewInvoiceForm) =>
  a.cfeType === b.cfeType && CLIENT_FIELDS.every((field) => same(a[field], b[field]));

// Lo que se guarda del formulario. El cliente y los ítems que no se tocaron
// quedan como estaban (con todos sus datos y decimales); solo lo cambiado se
// arma de nuevo como en Nueva factura.
export const formToDraftData = (stored: DraftEditorInvoice, storedForm: NewInvoiceForm, form: NewInvoiceForm) => {
  const receiver = sameClient(storedForm, form) ? stored.receiver : getNewInvoiceReceiver(form);
  const items = same(storedForm.items, form.items) && stored.items ? stored.items : getNewInvoiceItems(form);
  return {
    adenda: form.adenda.trim() || null,
    cfeType: form.cfeType,
    currency: form.currency,
    items,
    paymentForm: form.paymentForm,
    purchaseOrder: form.purchaseOrder.trim() || null,
    receiver,
    receiverDocument: receiver?.documento?.replace(/[\s.-]/g, "") || null,
    total: getItemsTotal(items),
  };
};

const money = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatEditorMoney = (amount: number, currency = "UYU") => `${currency === "USD" ? "US$" : "$"} ${money.format(amount)}`;
const day = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "sin fecha");

// Las líneas que cambiaron, en palabras: lo que se audita y lo que muestra
// el editor (el agente usa las mismas frases).
export const describeItemChanges = (before: InvoiceItemPayload[], after: InvoiceItemPayload[], currency = "UYU") => {
  if (before.length !== after.length) return [`Ítems: ${before.length} → ${after.length} líneas`];
  return after.flatMap((item, index) => {
    const prev = before[index];
    const notes: string[] = [];
    if (prev.concepto !== item.concepto) notes.push(`Detalle "${prev.concepto}" → "${item.concepto}"`);
    if (prev.precio !== item.precio) notes.push(`Precio ${formatEditorMoney(prev.precio, currency)} → ${formatEditorMoney(item.precio, currency)} sin IVA`);
    if (prev.cantidad !== item.cantidad) notes.push(`Cantidad de "${item.concepto}" ${prev.cantidad} → ${item.cantidad}`);
    if (prev.indicador_facturacion !== item.indicador_facturacion) notes.push(`IVA de "${item.concepto}" ${prev.indicador_facturacion} → ${item.indicador_facturacion}`);
    const extras = ["descripcion", "codigo", "unidad_medida", "descuento_cantidad", "descuento_tipo", "recargo_cantidad", "recargo_tipo"] as const;
    if (extras.some((key) => (prev[key] ?? null) !== (item[key] ?? null))) notes.push(`Más campos de "${item.concepto}"`);
    return notes;
  });
};

// Lo que cambió al guardar el formulario, para la auditoría y el aviso.
export const describeFormChanges = (before: NewInvoiceForm, after: NewInvoiceForm, items: { after: InvoiceItemPayload[]; before: InvoiceItemPayload[] }) => {
  const notes: string[] = [];
  const types: Record<number, string> = { 101: "e-Ticket", 111: "e-Factura" };
  if (before.cfeType !== after.cfeType) notes.push(`Tipo ${types[before.cfeType]} → ${types[after.cfeType]}`);
  if (before.issueDate !== after.issueDate) notes.push(`Emisión ${day(before.issueDate)} → ${day(after.issueDate)}`);
  if (before.paymentForm !== after.paymentForm) notes.push(after.paymentForm === PAYMENT_FORM.CREDIT ? "Contado → Crédito" : "Crédito → Contado");
  if (after.paymentForm === PAYMENT_FORM.CREDIT && before.dueDate !== after.dueDate) notes.push(`Vencimiento ${day(before.dueDate)} → ${day(after.dueDate)}`);
  if (before.currency !== after.currency) notes.push(`Moneda ${before.currency} → ${after.currency}`);
  if (before.purchaseOrder !== after.purchaseOrder) notes.push(after.purchaseOrder ? `Orden de compra ${after.purchaseOrder}` : "Sin orden de compra");
  if (!sameClient({ ...before, cfeType: after.cfeType }, after)) notes.push(after.consumer && after.cfeType === 101 ? "Cliente: consumidor final" : `Cliente ${after.name || after.document}`);
  notes.push(...describeItemChanges(items.before, items.after, after.currency));
  if (before.adenda.trim() !== after.adenda.trim()) notes.push(after.adenda.trim() ? "Adenda cambiada" : "Sin adenda");
  return notes;
};
