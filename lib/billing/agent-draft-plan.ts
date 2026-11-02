import { applyDraftLineEdits } from "@/lib/billing/draft-edit";
import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import type { BillerRutData } from "@/lib/billing/biller-read";
import { getReceiverName } from "@/lib/billing/invoice-json";
import type { InvoiceItemPayload, InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";
import { getItemsSubtotal, getItemsTotal } from "@/lib/billing/invoice-totals";

// Lo que el agente cambia en el borrador de un mes (docs/billing.md,
// "Agente"). Puro: draftInvoices lo aplica en una transacción y
// check:billing lo prueba sin base.
export type AgentDraftChange = {
  invoiceId: string;
  selected: boolean | null;
  lines: { index: number; concepto: string | null; precio: number | null }[] | null;
};

export type AgentDraftAddition = {
  rut: string;
  concepto: string;
  precio: number;
  cantidad: number | null;
};

export type AgentDraftInvoice = {
  id: string;
  items: InvoiceItemPayload[] | null;
  label?: string | null;
  receiver: InvoiceReceiverPayload | null;
  receiverDocument: string | null;
  selected: boolean;
  status: string;
};

export type AgentDraftNote = { invoiceId: string | null; name: string; text: string };

const RUT_DOCUMENT = 2;
const E_FACTURA = 111;
// Tasa básica: el indicador de una factura nueva cuando no hay una emitida de
// la que tomarlo (docs/billing.md, Literal E).
const DEFAULT_INDICATOR = 3;

const money = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const formatMoney = (amount: number) => `$ ${money.format(amount)}`;

export const normalizeRut = (rut: string) => rut.replace(/\D/g, "");

export type PlannedEdit = {
  invoiceId: string;
  items: InvoiceItemPayload[] | null;
  notes: AgentDraftNote[];
  selected: boolean | null;
};

export type ChangePlan = { edits: PlannedEdit[]; ok: true } | { error: string; ok: false };

// Valida y arma cada cambio contra las facturas del borrador abierto. Un id
// que no es del borrador, una emitida o una línea que no existe frena todo:
// el agente vuelve a leer el borrador y reintenta.
export const planDraftChanges = (invoices: AgentDraftInvoice[], changes: AgentDraftChange[]): ChangePlan => {
  const byId = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const edits: PlannedEdit[] = [];
  for (const change of changes) {
    const invoice = byId.get(change.invoiceId);
    if (!invoice) return { error: `La factura ${change.invoiceId} no está en el borrador de este mes`, ok: false };
    const name = getReceiverName(invoice.receiver, invoice.label);
    if (invoice.status !== "DRAFT") {
      return { error: `La factura de ${name} ya está emitida (o emitiéndose): no se cambia desde el borrador`, ok: false };
    }

    const notes: AgentDraftNote[] = [];
    const note = (text: string) => notes.push({ invoiceId: invoice.id, name, text });
    const selected = change.selected !== null && change.selected !== invoice.selected ? change.selected : null;
    if (selected !== null) note(selected ? "Marcada" : "Desmarcada");

    let items: InvoiceItemPayload[] | null = null;
    const lines = (change.lines ?? [])
      .map((line) => ({
        index: line.index,
        ...(line.concepto !== null ? { concepto: line.concepto.trim() } : {}),
        ...(line.precio !== null ? { precio: line.precio } : {}),
      }))
      .filter((line) => "concepto" in line || "precio" in line);
    if (lines.length) {
      const before = invoice.items ?? [];
      items = applyDraftLineEdits(before, lines);
      if (!items) return { error: `La factura de ${name} tiene ${before.length} línea(s): revisá el índice`, ok: false };
      const selectionNotes = notes.length;
      items.forEach((item, index) => {
        const prev = before[index];
        if (prev.concepto !== item.concepto) note(`Detalle "${prev.concepto}" → "${item.concepto}"`);
        if (prev.precio !== item.precio) note(`Precio ${formatMoney(prev.precio)} → ${formatMoney(item.precio)} sin IVA`);
      });
      // Mandar el mismo detalle o el mismo precio no es un cambio.
      if (notes.length === selectionNotes) items = null;
    }
    if (selected !== null || items) edits.push({ invoiceId: invoice.id, items, notes, selected });
  }
  return { edits, ok: true };
};

export type PlannedAddition = {
  items: InvoiceItemPayload[];
  note: AgentDraftNote;
  receiver: InvoiceReceiverPayload;
  receiverDocument: string;
  total: number;
};

// Una factura nueva para un cliente que no estaba: e-Factura a crédito con el
// RUT pedido y la razón social y el domicilio de DGI. El indicador de IVA es
// el de la última emitida.
export const planDraftAddition = (
  addition: AgentDraftAddition,
  rutData: BillerRutData,
  existing: AgentDraftInvoice[],
  indicator: number | null
): PlannedAddition | { error: string } => {
  const rut = normalizeRut(addition.rut);
  if (rut.length !== 12) return { error: `El RUT ${addition.rut} no tiene 12 dígitos: una e-Factura lo necesita` };
  const already = existing.find((invoice) => normalizeRut(invoice.receiverDocument ?? "") === rut);
  if (already) {
    return { error: `${getReceiverName(already.receiver)} (RUT ${rut}) ya está en el borrador: cambiá esa factura` };
  }
  if (!rutData.name) return { error: `DGI no devolvió la razón social del RUT ${rut}` };

  const receiver: InvoiceReceiverPayload = {
    tipo_documento: RUT_DOCUMENT,
    documento: rut,
    razon_social: rutData.name,
    nombre_fantasia: null,
    sucursal: { direccion: rutData.address, ciudad: rutData.city, departamento: rutData.department, pais: "UY" },
  };
  const items: InvoiceItemPayload[] = [
    {
      codigo: null,
      cantidad: addition.cantidad ?? 1,
      concepto: addition.concepto.trim(),
      descripcion: null,
      precio: Math.round(addition.precio * 100) / 100,
      indicador_facturacion: indicator ?? DEFAULT_INDICATOR,
      unidad_medida: null,
    },
  ];
  const total = getItemsTotal(items);
  return {
    items,
    note: { invoiceId: null, name: rutData.name, text: `Nueva e-Factura: ${items[0].concepto}, ${formatMoney(getItemsSubtotal(items))} sin IVA` },
    receiver,
    receiverDocument: rut,
    total,
  };
};

// A crédito, con vencimiento el 10 del mes de emisión (feature 50).
export const NEW_INVOICE_DEFAULTS = { cfeType: E_FACTURA, currency: "UYU", paymentForm: PAYMENT_FORM.CREDIT } as const;
