import type { InvoiceStatus } from "@prisma/client";

import { getPeriodOfIssueDate, parseBillerDateTime, parseIssueDate } from "@/lib/billing/billing-month";
import type {
  BillerInvoice,
  BillerInvoiceDetail,
  BillerItem,
  BillerReceiver,
} from "@/lib/billing/biller-schemas";

export type CfeKind = "invoice" | "credit_note" | "debit_note" | "other";

// Familias 10x a 14x: e-Ticket, e-Factura, exportación y venta por cuenta
// ajena. Termina en 1 el comprobante, en 2 su nota de crédito y en 3 la de
// débito. Remitos, resguardos y boletas (compras) no son facturación.
export const classifyCfe = (cfeType: number): CfeKind => {
  const family = Math.floor(cfeType / 10);
  if (family < 10 || family > 14) return "other";
  return ({ 1: "invoice", 2: "credit_note", 3: "debit_note" } as const)[cfeType % 10 as 1 | 2 | 3] ?? "other";
};

const CFE_LABELS: Record<number, string> = {
  101: "e-Ticket",
  102: "Nota de crédito de e-Ticket",
  103: "Nota de débito de e-Ticket",
  111: "e-Factura",
  112: "Nota de crédito de e-Factura",
  113: "Nota de débito de e-Factura",
};

export const getCfeLabel = (cfeType: number) => CFE_LABELS[cfeType] ?? `CFE ${cfeType}`;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Estados vistos en test: "Pendiente DGI" (e-Factura recién emitida),
// "Aceptado DGI" y "Envío no corresponde" (un e-Ticket que DGI recibe en el
// reporte diario, no de a uno: es definitivo). Lo desconocido queda ISSUED y
// se vuelve a leer.
export const mapBillerStatus = (estado: string | null | undefined): InvoiceStatus => {
  const value = normalize(estado ?? "");
  if (value.includes("rechaz")) return "REJECTED";
  if (value.includes("aceptad") || value.includes("no corresponde")) return "ACCEPTED";
  return "ISSUED";
};

const DOCUMENT_TYPES: Record<string, number> = {
  RUT: 2,
  CI: 3,
  OTRO: 4,
  PASAPORTE: 5,
  DNI: 6,
  NIFE: 7,
};

// detalle devuelve "RUT" o "CI"; emitir pide el código (2, 3…).
export const toDocumentTypeCode = (value: string) =>
  /^\d+$/.test(value) ? Number(value) : DOCUMENT_TYPES[normalize(value).toUpperCase()] ?? null;

// El receptor y los ítems se guardan con la forma que pide emitir, para que
// repetir una factura sea mandar lo mismo con otro mes y otro precio.
export const toReceiverPayload = (cliente: BillerReceiver) => ({
  tipo_documento: toDocumentTypeCode(cliente.tipo_documento),
  documento: cliente.documento ?? null,
  razon_social: cliente.razon_social ?? null,
  nombre_fantasia: cliente.nombre_fantasia ?? null,
  sucursal: {
    direccion: cliente.sucursal?.direccion ?? null,
    ciudad: cliente.sucursal?.ciudad ?? null,
    departamento: cliente.sucursal?.departamento ?? null,
    pais: cliente.sucursal?.pais ?? "UY",
  },
});

const positive = (value: string | null | undefined) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

export const toItemPayload = (item: BillerItem) => {
  const discount = positive(item.descuento_cantidad);
  const surcharge = positive(item.recargo_cantidad);
  return {
    codigo: item.codigo ?? null,
    cantidad: Number(item.cantidad),
    concepto: item.concepto,
    descripcion: item.descripcion ?? null,
    precio: Number(item.precio),
    indicador_facturacion: item.indicador_facturacion,
    unidad_medida: item.unidad_medida ?? null,
    ...(discount ? { descuento_tipo: item.descuento_tipo ?? "$", descuento_cantidad: discount } : {}),
    ...(surcharge ? { recargo_tipo: item.recargo_tipo ?? "$", recargo_cantidad: surcharge } : {}),
  };
};

export type InvoiceReceiverPayload = ReturnType<typeof toReceiverPayload>;
export type InvoiceItemPayload = ReturnType<typeof toItemPayload>;

const toDetailFields = (detail: BillerInvoiceDetail) => {
  const references = (detail.referencias ?? []).map((reference) => ({
    id: reference.id ?? null,
    cfeType: reference.tipo_comprobante,
    series: reference.serie ?? null,
    number: reference.numero,
    issueDate: reference.fecha_emision ?? null,
  }));
  return {
    items: (detail.items ?? []).map(toItemPayload),
    references,
    referenceIds: references.flatMap((reference) => (reference.id === null ? [] : [reference.id])),
  };
};

// Una fila de Biller (y su detalle, si se leyó) → la copia local.
export const toBillerInvoiceRecord = (row: BillerInvoice, detail?: BillerInvoiceDetail) => {
  const issueDate = parseIssueDate(row.fecha_emision);
  if (!issueDate) throw new Error(`Fecha de emisión inválida: ${row.fecha_emision}`);
  const receiver = row.cliente ? toReceiverPayload(row.cliente) : null;

  return {
    billerId: row.id,
    cfeType: row.tipo_comprobante,
    status: mapBillerStatus(row.estado),
    billerStatus: row.estado ?? null,
    period: getPeriodOfIssueDate(issueDate),
    issueDate,
    dueDate: row.fecha_vencimiento ? parseIssueDate(row.fecha_vencimiento) : null,
    currency: row.moneda,
    total: row.total,
    receiver,
    receiverDocument: receiver?.documento ?? null,
    adenda: row.adenda ?? null,
    purchaseOrder: row.numero_compra ?? row.numero_orden ?? null,
    internalNumber: row.numero_interno ?? null,
    billerSucursal: row.sucursal ?? null,
    series: row.serie ?? null,
    number: row.numero,
    cae: row.cae ?? null,
    billerCreatedAt: parseBillerDateTime(row.fecha_creacion),
    detail: detail ? toDetailFields(detail) : null,
  };
};

export type BillerInvoiceRecord = ReturnType<typeof toBillerInvoiceRecord>;
