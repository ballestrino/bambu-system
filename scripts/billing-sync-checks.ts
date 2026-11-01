import assert from "node:assert/strict";

import { BillerError } from "../lib/billing/biller-errors";
import { createBillerReader } from "../lib/billing/biller-read";
import { billerInvoiceDetailSchema, billerInvoiceSchema } from "../lib/billing/biller-schemas";
import { getSyncCreationWindow, parseBillerDateTime, parseBillingPeriod } from "../lib/billing/billing-month";
import { compareBillingMonths, summarizeBillingMonth } from "../lib/billing/billing-summary";
import { classifyCfe, mapBillerStatus, toBillerInvoiceRecord, type BillerInvoiceRecord } from "../lib/billing/invoice-mapping";
import { syncBillerPeriod, type InvoiceSyncStore } from "../lib/billing/invoice-sync-core";
import { creditNoteDetail, detailsById, eFacturaRow, eTicketDetail, listRows } from "./billing-fixtures";

// --- Meses: UTC como assignedMonth; Biller fecha en hora de Montevideo.
const october = parseBillingPeriod("2026-10")!;
assert.equal(october.toISOString(), "2026-10-01T00:00:00.000Z");
assert.equal(parseBillingPeriod("2026-13"), null);
assert.equal(parseBillerDateTime("2026-10-30 11:57:05")?.toISOString(), "2026-10-30T14:57:05.000Z");
const now = new Date("2026-10-30T15:00:00Z");
assert.deepEqual(getSyncCreationWindow(october, now), { from: "2026-08-01 00:00:00", to: "2026-10-30 12:00:00" });
assert.deepEqual(getSyncCreationWindow(parseBillingPeriod("2026-07")!, now), { from: "2026-05-01 00:00:00", to: "2026-09-01 00:00:00" });

// --- Tipos y estados vistos en test.
assert.deepEqual([101, 111, 102, 112, 113, 124, 151, 181].map(classifyCfe),
  ["invoice", "invoice", "credit_note", "credit_note", "debit_note", "other", "other", "other"]);
assert.equal(mapBillerStatus("Pendiente DGI"), "ISSUED");
assert.equal(mapBillerStatus("Aceptado DGI"), "ACCEPTED");
assert.equal(mapBillerStatus("Envío no corresponde"), "ACCEPTED");
assert.equal(mapBillerStatus("Rechazado por DGI"), "REJECTED");
assert.equal(mapBillerStatus(null), "ISSUED");

// --- Una fila de Biller → la copia, con el receptor y los ítems como los pide emitir.
const ticketDetail = billerInvoiceDetailSchema.parse(eTicketDetail);
const ticket = toBillerInvoiceRecord(ticketDetail, ticketDetail);
assert.equal(ticket.period.toISOString(), "2026-10-01T00:00:00.000Z");
assert.equal(ticket.status, "ACCEPTED");
assert.equal(ticket.purchaseOrder, "OC-2");
assert.deepEqual(ticket.receiver, {
  tipo_documento: 3, documento: "47395795", razon_social: null, nombre_fantasia: "Cliente Prueba",
  sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY" },
});
assert.deepEqual(ticket.detail?.items, [{
  codigo: null, cantidad: 1, concepto: "Limpieza de hogar - octubre 2026", descripcion: null, precio: 5400,
  indicador_facturacion: 3, unidad_medida: null,
}]);
const noteDetail = billerInvoiceDetailSchema.parse(creditNoteDetail);
const note = toBillerInvoiceRecord(noteDetail, noteDetail);
assert.deepEqual(note.detail?.referenceIds, [445330]);
const factura = toBillerInvoiceRecord(billerInvoiceSchema.parse(eFacturaRow));
assert.equal(factura.detail, null);
assert.equal(factura.receiver?.tipo_documento, 2);
assert.equal(factura.purchaseOrder, "OC-1");
assert.equal(factura.dueDate?.toISOString(), "2026-11-15T00:00:00.000Z");

// --- Resumen: neto = facturas − notas de crédito; rechazos y borradores aparte.
const october2026 = summarizeBillingMonth([
  { cfeType: 111, currency: "UYU", status: "ISSUED", total: "14640.00" },
  { cfeType: 101, currency: "UYU", status: "ACCEPTED", total: "6588.00" },
  { cfeType: 102, currency: "UYU", status: "ACCEPTED", total: "6588.00" },
  { cfeType: 111, currency: "UYU", status: "REJECTED", total: "1000.00" },
  { cfeType: 111, currency: "UYU", status: "DRAFT", total: "9999.00" },
  { cfeType: 181, currency: "UYU", status: "ACCEPTED", total: "0" },
]);
assert.equal(october2026.net, 14640);
assert.equal(october2026.invoiceCount, 2);
assert.deepEqual(october2026.invoicesByType, { eFactura: 1, eTicket: 1, other: 0 });
assert.equal(october2026.creditNoteCount, 1);
assert.equal(october2026.pendingCount, 1);
assert.equal(october2026.rejectedCount, 1);
const compared = compareBillingMonths(october2026, summarizeBillingMonth([{ cfeType: 101, currency: "UYU", status: "ACCEPTED", total: 5000 }]));
assert.deepEqual(compared.delta, { invoiceCount: 1, net: 9640 });

// --- Sincronizar dos veces: la segunda actualiza, no duplica ni vuelve a pedir detalles.
const run = async () => {
  const rows = new Map<number, BillerInvoiceRecord & { hasItems: boolean }>();
  const store: InvoiceSyncStore = {
    findDetailedBillerIds: async (ids) => new Set(ids.filter((id) => rows.get(id)?.hasItems)),
    upsertBillerInvoice: async (record) => {
      const existing = rows.get(record.billerId);
      rows.set(record.billerId, { ...record, hasItems: Boolean(record.detail) || Boolean(existing?.hasItems) });
      return existing ? "updated" : "created";
    },
  };
  const detailCalls: number[] = [];
  const reader = createBillerReader(async (path, query) => {
    if (path === "/v2/comprobantes/obtener") return listRows;
    const id = Number(query?.id);
    detailCalls.push(id);
    if (id === 445331 && detailCalls.length === 3) throw new BillerError("not_found", "no");
    return detailsById.get(id);
  });

  const first = await syncBillerPeriod(october, { now, reader, store });
  assert.deepEqual([first.fetched, first.created, first.updated, first.detailsRead, first.detailErrors], [3, 3, 0, 2, 1]);
  const second = await syncBillerPeriod(october, { now, reader, store });
  assert.deepEqual([second.fetched, second.created, second.updated, second.detailsRead, second.detailErrors], [3, 0, 3, 1, 0]);
  assert.equal(rows.size, 3);
  assert.deepEqual(detailCalls, [445329, 445330, 445331, 445331]);

  await assert.rejects(
    syncBillerPeriod(october, { now, store, reader: createBillerReader(async () => { throw new BillerError("unauthorized", "x"); }) }),
    (error: BillerError) => error.kind === "unauthorized"
  );
};

export const billingSyncChecks = run();
