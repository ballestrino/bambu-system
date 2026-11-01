import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import {
  emptyNewInvoiceItem,
  getNewInvoiceDueDays,
  getNewInvoiceItems,
  getNewInvoiceProblems,
  getNewInvoiceTotals,
  newInvoiceDefaults,
  RUT_DOCUMENT,
  type NewInvoiceForm,
  type NewInvoiceItem,
} from "@/lib/billing/new-invoice";
import { getLineSubtotal } from "@/lib/billing/invoice-totals";
import { newInvoiceFormSchema, newInvoiceItemSchema } from "@/schemas/billing-new-invoice";

// El agente dentro de Nueva factura (feature 46, docs/billing.md). Puro: el
// formulario que manda la página como contexto del turno, leído sin
// rechazarlo por un campo a medio escribir, y su descripción para el prompt.
const money = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatInvoiceMoney = (amount: number, currency: NewInvoiceForm["currency"] = "UYU") =>
  `${currency === "USD" ? "US$" : "$"} ${money.format(amount)}`;

const DOCUMENT_TYPES: Record<number, string> = { 2: "RUT", 3: "CI", 4: "Otro", 5: "Pasaporte", 6: "DNI", 7: "NIFE" };
export const CFE_LABELS: Record<NewInvoiceForm["cfeType"], string> = { 111: "e-Factura", 101: "e-Ticket" };

// Cada campo válido se toma; uno inválido queda con el valor por defecto. Los
// ítems inválidos se descartan, y si no queda ninguno va uno vacío, como en la
// página.
export const sanitizeNewInvoiceForm = (value: unknown, today: string, indicator: number): NewInvoiceForm => {
  const form = newInvoiceDefaults(today, indicator);
  if (!value || typeof value !== "object") return form;
  const shape = newInvoiceFormSchema.shape;
  const clean: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key === "items" || !Object.hasOwn(shape, key)) continue;
    const parsed = shape[key as keyof typeof shape].safeParse(raw);
    if (parsed.success) clean[key] = parsed.data;
  }
  const rawItems = (value as { items?: unknown }).items;
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .slice(0, 40)
    .map((item) => newInvoiceItemSchema.safeParse(item))
    .flatMap((parsed) => (parsed.success ? [parsed.data as NewInvoiceItem] : []));
  return { ...form, ...clean, items: items.length ? items : [emptyNewInvoiceItem(indicator)] };
};

const describeClient = (form: NewInvoiceForm) => {
  if (form.cfeType === 101 && form.consumer) return "Consumidor final (sin datos).";
  const parts = [
    form.name.trim() || "sin nombre",
    form.document.trim() ? `${DOCUMENT_TYPES[form.documentType] ?? "Documento"} ${form.document.trim()}` : "sin documento",
    form.tradeName.trim() ? `fantasía "${form.tradeName.trim()}"` : null,
    [form.address, form.city, form.department].map((part) => part.trim()).filter(Boolean).join(", ") || null,
    form.emails.length ? `emails ${form.emails.join(", ")}` : null,
  ];
  return `${parts.filter(Boolean).join(" · ")}.`;
};

const describeItem = (item: NewInvoiceItem, index: number, currency: NewInvoiceForm["currency"]) => {
  const line = getNewInvoiceItems({ ...newInvoiceDefaults("2000-01-01", item.indicador), items: [item] })[0];
  if (!line) return `  ${index + 1}. (vacío)`;
  const extras = [
    item.unidad ? `unidad ${item.unidad}` : null,
    item.descripcion ? `descripción "${item.descripcion}"` : null,
    item.descuento ? `descuento ${item.descuento}${item.descuentoTipo}` : null,
    item.recargo ? `recargo ${item.recargo}${item.recargoTipo}` : null,
  ].filter(Boolean);
  return `  ${index + 1}. "${line.concepto || "sin concepto"}" · ${line.cantidad} × ${formatInvoiceMoney(line.precio, currency)} sin IVA = ${formatInvoiceMoney(getLineSubtotal(line), currency)} · indicador ${line.indicador_facturacion}${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
};

// Lo que el usuario tiene en pantalla, en el orden del formulario, con los
// totales y lo que falta para emitir.
export const describeNewInvoiceForm = (form: NewInvoiceForm, today: string) => {
  const totals = getNewInvoiceTotals(form);
  const problems = getNewInvoiceProblems(form, today);
  const credit = form.paymentForm === PAYMENT_FORM.CREDIT;
  const dueDays = getNewInvoiceDueDays(form);
  return [
    `Comprobante: ${CFE_LABELS[form.cfeType]} · emisión ${form.issueDate || "sin fecha"} · ${credit ? `crédito, vence ${form.dueDate || "sin fecha"}${dueDays !== null ? ` (${dueDays} días)` : ""}` : "contado"} · ${form.currency}${form.purchaseOrder ? ` · orden de compra ${form.purchaseOrder}` : ""}.`,
    `Cliente: ${describeClient(form)}`,
    `Ítems:\n${form.items.map((item, index) => describeItem(item, index, form.currency)).join("\n")}`,
    form.adenda.trim() ? `Adenda: "${form.adenda.trim()}".` : null,
    `Totales: neto ${formatInvoiceMoney(totals.subtotal, form.currency)}${totals.taxes.map((tax) => ` · IVA ${Math.round(tax.rate * 100)} % ${formatInvoiceMoney(tax.amount, form.currency)}`).join("")} · total ${formatInvoiceMoney(totals.total, form.currency)}.`,
    problems.length ? `Falta para emitir: ${problems.join(" ")}` : "Está completa: se puede emitir.",
  ]
    .filter(Boolean)
    .join("\n");
};

// Los importes del formulario se pueden citar (los escribió el usuario).
export const getNewInvoiceFormAmounts = (form: NewInvoiceForm) => {
  const totals = getNewInvoiceTotals(form);
  return [
    ...getNewInvoiceItems(form).flatMap((item) => [item.precio, getLineSubtotal(item)]),
    totals.subtotal,
    totals.total,
    ...totals.taxes.map((tax) => tax.amount),
  ];
};

// El texto del contexto del turno: dónde está el usuario y qué tiene cargado.
export const formatNewInvoiceContext = (form: NewInvoiceForm, today: string, monthLabel: string) =>
  [
    `El usuario está en Nueva factura (Facturación, borrador de ${monthLabel}). Lo que pida sobre "la factura" es este formulario: completalo con fillInvoiceForm.`,
    `Hoy es ${today} en Montevideo. RUT es el documento ${RUT_DOCUMENT}.`,
    `Formulario actual (sin emitir):\n${describeNewInvoiceForm(form, today)}`,
  ].join("\n");
