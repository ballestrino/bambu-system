import assert from "node:assert/strict";

import { BillerError } from "../lib/billing/biller-errors";
import { linkCreditNotes, type LinkedNote } from "../lib/billing/credit-note-links";
import { buildCreditNotePayload, type CreditNoteInput } from "../lib/billing/credit-note-payload";
import { getCreditBlocker, getCreditState, planCreditNote, type CreditableInvoice } from "../lib/billing/credit-note-plan";
import { runCreditNoteIssue } from "../lib/billing/credit-note-run";
import type { BillerInvoice } from "../lib/billing/biller-schemas";
import type { SendOutcome } from "../lib/billing/issue-run";
import { getJobWarnings, getReceiverKey, suggestJobs } from "../lib/billing/receiver-job";
import { creditNoteSchema } from "../schemas/billing";
import { eFacturaRow } from "./billing-fixtures";

// Feature 43: notas de crédito desde la página y receptores vinculados a
// trabajos para los avisos del borrador.
const item = (concepto: string, precio: number, indicador = 3) => ({
  codigo: null, cantidad: 1, concepto, descripcion: null, precio, indicador_facturacion: indicador, unidad_medida: null,
});
const invoice = (patch: Partial<CreditableInvoice> = {}): CreditableInvoice => ({
  billerId: 500, cfeType: 111, items: [item("Limpieza noviembre", 10000), item("Vidrios", 2000)], number: 1043,
  status: "ACCEPTED", total: 14640, ...patch,
});
const note = (total: number, status: LinkedNote["status"] = "ACCEPTED") => ({ cfeType: 112, status, total });

// --- Por el total: copia las líneas, tipo 112 y el total con IVA.
const full = planCreditNote(invoice(), [], { mode: "full" });
assert.ok(full.ok);
assert.deepEqual([full.cfeType, full.subtotal, full.total, full.items.length], [112, 12000, 14640, 2]);
assert.equal(planCreditNote(invoice({ cfeType: 101, total: 12000 }), [], { mode: "full" }).ok && 102, 102);

// --- Parcial: monto sin IVA por línea, con el concepto y el indicador de la línea.
const partial = planCreditNote(invoice(), [], { lines: [{ amount: 2500, index: 0 }, { amount: 0, index: 1 }], mode: "partial" });
assert.ok(partial.ok);
assert.deepEqual(partial.items, [{ cantidad: 1, codigo: null, concepto: "Limpieza noviembre", descripcion: null, indicador_facturacion: 3, precio: 2500, unidad_medida: null }]);
assert.equal(partial.total, 3050);
const errorOf = (...args: Parameters<typeof planCreditNote>) => {
  const result = planCreditNote(...args);
  return result.ok ? null : result.error;
};
assert.match(errorOf(invoice(), [], { lines: [{ amount: 10001, index: 0 }], mode: "partial" })!, /subtotal/);
assert.match(errorOf(invoice(), [], { lines: [{ amount: 1, index: 7 }], mode: "partial" })!, /no está en la factura/);
assert.match(errorOf(invoice(), [], { lines: [{ amount: 0, index: 0 }], mode: "partial" })!, /al menos una línea/);
// Lo ya acreditado cuenta: no se pasa de lo que queda, y por el total ya no va.
assert.match(errorOf(invoice(), [note(12200)], { lines: [{ amount: 2500, index: 0 }], mode: "partial" })!, /supera/);
assert.ok(planCreditNote(invoice(), [note(12200)], { lines: [{ amount: 2000, index: 0 }], mode: "partial" }).ok);
assert.match(errorOf(invoice(), [note(1220)], { mode: "full" })!, /parcial/);
// Una rechazada no cuenta; una en curso o sin confirmar frena; anulada, también.
assert.equal(getCreditState(invoice(), [note(14640, "REJECTED")]).credited, 0);
assert.match(getCreditBlocker(invoice(), [note(100, "UNKNOWN")])!, /sin confirmar/);
assert.match(getCreditBlocker(invoice(), [note(14640)])!, /anulada/);
assert.match(getCreditBlocker(invoice({ status: "ISSUED", billerId: null }), [])!, /no está emitida/);
assert.match(getCreditBlocker(invoice({ status: "REJECTED" }), [])!, /no está emitida/);
assert.match(getCreditBlocker(invoice({ cfeType: 112 }), [])!, /e-Factura o un e-Ticket/);
assert.match(getCreditBlocker(invoice({ items: null }), [])!, /líneas/);

// --- La entrada de la acción: razón obligatoria y de hasta 90.
const base = { credited: 0, invoiceId: "i", reason: "Dos visitas no realizadas", total: 3050 };
assert.ok(creditNoteSchema.safeParse({ ...base, mode: "full" }).success);
assert.ok(creditNoteSchema.safeParse({ ...base, lines: [{ amount: 2500, index: 0 }], mode: "partial" }).success);
assert.ok(!creditNoteSchema.safeParse({ ...base, mode: "partial" }).success);
assert.ok(!creditNoteSchema.safeParse({ ...base, mode: "full", reason: " " }).success);
assert.ok(!creditNoteSchema.safeParse({ ...base, mode: "full", reason: "x".repeat(91) }).success);

// --- El pedido a Biller: emitir con tipo 112, el mismo cliente, la referencia y la razón.
const rut = { tipo_documento: 2, documento: "211186720014", razon_social: "Colegio Los Pinos S.A.", nombre_fantasia: null,
  sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY" } };
const noteInput: CreditNoteInput = {
  cfeType: 112, currency: "UYU", internalNumber: "BAMBU-n1", items: partial.items, paymentForm: 2,
  reason: "Dos visitas no realizadas", receiver: rut,
  reference: { billerId: 500, cfeType: 111, issueDate: new Date("2026-11-03T00:00:00Z"), number: 1043, series: "A" },
};
const day = new Date("2026-11-20T00:00:00Z");
assert.deepEqual(buildCreditNotePayload(noteInput, day), {
  cliente: { tipo_documento: 2, documento: "211186720014", razon_social: "Colegio Los Pinos S.A.", sucursal: { pais: "UY" } },
  fecha_emision: "20/11/2026", forma_pago: 2,
  items: [{ cantidad: 1, concepto: "Limpieza noviembre", indicador_facturacion: 3, precio: 2500 }],
  moneda: "UYU", montos_brutos: 0, numero_interno: "BAMBU-n1", razon_referencia: "Dos visitas no realizadas",
  referencias: [{ tipo_comprobante: 111, serie: "A", numero: 1043, fecha_emision: "03/11/2026" }],
  tipo_comprobante: 112,
});

// --- Emitir la nota con un Biller falso: emitida, encontrada tras un timeout, rechazo y sin permiso.
const runNote = async (replies: (() => unknown)[], found: BillerInvoice | null = null) => {
  const saved: SendOutcome[] = [];
  let sends = 0;
  const result = await runCreditNoteIssue("n1", {
    findByInternalNumber: async () => found,
    issuer: { issue: async () => { sends += 1; const reply = replies.shift()!(); if (reply instanceof Error) throw reply; return reply as never; } },
    now: () => new Date("2026-11-20T15:00:00Z"),
    sleep: async () => undefined,
    store: { load: async () => noteInput, save: async (_id, outcome) => { saved.push(outcome); } },
  });
  return { result, saved, sends };
};
const correctionRunChecks = (async () => {
  const issued = await runNote([() => ({ billerId: 9001, number: 18, series: "A" })]);
  assert.deepEqual(issued.result, { kind: "issued", number: 18, series: "A" });
  const existing = { ...eFacturaRow, numero_interno: "BAMBU-n1", tipo_comprobante: 112, serie: "A", numero: 18 } as unknown as BillerInvoice;
  const found = await runNote([() => new BillerError("network", "timeout")], existing);
  assert.equal(found.result.kind, "found");
  assert.equal(found.sends, 1, "un timeout que llegó no se reenvía");
  const lost = await runNote([() => new BillerError("network", "t"), () => new BillerError("network", "t")]);
  assert.equal(lost.result.kind, "unknown");
  assert.equal(lost.sends, 2);
  const rejected = await runNote([() => new BillerError("validation", "campos no soportados en la v3")]);
  assert.equal(rejected.result.kind, "failed");
  assert.equal(rejected.saved[0]?.kind, "failed");
  const denied = await runNote([() => new BillerError("unauthorized", "token")]);
  assert.equal(denied.result.kind, "failed");
})();

// --- Notas que apuntan a cada factura: anulada por cuál, parcial, sin confirmar.
const linked = (id: string, total: number, refs: number[], status: LinkedNote["status"] = "ACCEPTED"): LinkedNote => ({
  cfeType: 112, id, issueDate: new Date("2026-11-20T00:00:00Z"), number: 120424, referenceIds: refs, series: "MA", status, total,
});
const credits = linkCreditNotes(
  [{ billerId: 1, total: 1220 }, { billerId: 2, total: 1220 }, { billerId: 3, total: 1220 }, { billerId: 4, total: 100 }],
  [linked("n1", 1220, [1]), linked("n2", 200, [2]), linked("n3", 100, [3], "UNKNOWN"), linked("n4", 1, [4, 5])]
);
assert.deepEqual([credits.get(1)?.fully, credits.get(1)?.note?.label], [true, "NC MA 120424"]);
assert.deepEqual([credits.get(2)?.fully, credits.get(2)?.credited], [false, 200]);
assert.deepEqual([credits.get(3)?.inFlight, credits.get(3)?.unknownNoteId], [true, "n3"]);
assert.equal(credits.get(4)?.fully, true, "una nota que referencia varias facturas las anula");

// --- Vínculo receptor → trabajo: la clave, la sugerencia por nombre y los avisos.
assert.equal(getReceiverKey(rut), "211186720014");
assert.equal(getReceiverKey({ ...rut, documento: null, razon_social: "Clínica  Dental Ñandú" }), "nombre:clinica dental nandu");
assert.equal(getReceiverKey(null), null);
const jobs = [
  { id: "j1", name: "Colegio Los Pinos", scheduleName: null },
  { id: "j2", name: "Torre Norte", scheduleName: null },
  { id: "j3", name: "Colegio Inglés", scheduleName: null },
  { id: "j4", name: "Consultorios PC", scheduleName: "Clínica Dental" },
];
assert.deepEqual(suggestJobs(rut, jobs).map((match) => match.job.id), ["j1"]);
assert.deepEqual(suggestJobs({ ...rut, razon_social: "Panadería Sol SRL" }, jobs), []);
const clinic = { ...rut, razon_social: "Clínica Dental Punta Carretas S.R.L.", nombre_fantasia: "Clínica Dental PC" };
assert.deepEqual(suggestJobs(clinic, jobs).map((match) => match.job.id), ["j4"], "por el nombre de fantasía y el de agenda");
const job = { archivedAt: null, canceledVisits: 2, monthlyPrice: 12000, name: "Colegio Los Pinos", status: "ACTIVE" as const };
assert.deepEqual(getJobWarnings({ currency: "UYU", subtotal: 10000 }, job, "noviembre").map((warning) => warning.label), [
  "El trabajo cobra $ 12.000 sin IVA",
  "2 visitas canceladas en noviembre",
]);
assert.deepEqual(getJobWarnings({ currency: "UYU", subtotal: 12000.4 }, { ...job, canceledVisits: 0 }, "noviembre"), []);
assert.deepEqual(getJobWarnings({ currency: "UYU", subtotal: 12000 }, { ...job, canceledVisits: 0, status: "PAUSED" }, "noviembre").map((w) => w.kind), ["status"]);
assert.deepEqual(getJobWarnings({ currency: "USD", subtotal: 1 }, { ...job, canceledVisits: 0, monthlyPrice: 9 }, "noviembre"), []);

export const billingCorrectionChecks = correctionRunChecks;
