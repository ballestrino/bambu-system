import assert from "node:assert/strict";

import { getPaymentLabel } from "../lib/billing/billing-month-view";
import {
  getDefaultDueDate,
  getDefaultDueDay,
  getDefaultIssueDate,
  getDefaultIssueDay,
  pickExplicitDates,
  resolveDraftDates,
} from "../lib/billing/invoice-dates";
import type { BillerIssuer } from "../lib/billing/biller-issue";
import { runBatchIssue, type IssueCandidate, type IssueOutcome } from "../lib/billing/issue-run";

// Feature 50: se factura del 1 al 10 (docs/billing.md). Emisión: el día en que
// se emite, o el 1 del mes si se factura un mes que no empezó. Vencimiento: el
// 10 del mes de emisión, o a 5 días si se emite después del 10.
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);
const nov = day("2026-11-01");
const dec = day("2026-12-01");

// --- La emisión: un mes que no empezó sale el 1; si ya empezó (o pasó), hoy.
assert.equal(iso(getDefaultIssueDate(day("2026-10-30"), nov)), "2026-11-01");
assert.equal(iso(getDefaultIssueDate(day("2026-11-01"), nov)), "2026-11-01");
assert.equal(iso(getDefaultIssueDate(day("2026-11-07"), nov)), "2026-11-07");
assert.equal(iso(getDefaultIssueDate(day("2026-12-03"), nov)), "2026-12-03");
assert.equal(getDefaultIssueDay("2026-10-30", "2026-11"), "2026-11-01");
assert.equal(getDefaultIssueDay("2026-11-14", "2026-11"), "2026-11-14");

// --- El vencimiento: hasta el 10, el 10 del mes; después, a 5 días (también
// cruzando el mes y el año).
assert.equal(iso(getDefaultDueDate(day("2026-11-01"))), "2026-11-10");
assert.equal(iso(getDefaultDueDate(day("2026-11-10"))), "2026-11-10");
assert.equal(iso(getDefaultDueDate(day("2026-11-11"))), "2026-11-16");
assert.equal(iso(getDefaultDueDate(day("2026-11-28"))), "2026-12-03");
assert.equal(iso(getDefaultDueDate(day("2026-12-30"))), "2027-01-04");
assert.equal(getDefaultDueDay("2026-11-15"), "2026-11-20");
assert.equal(getDefaultDueDay(""), "");

// --- Una del borrador: las elegidas ganan; un vencimiento antes de la
// emisión se ignora; de contado no hay vencimiento.
const base = { explicitDue: null, explicitIssue: null, paymentForm: 2, period: nov, today: day("2026-10-30") };
assert.deepEqual([iso(resolveDraftDates(base).issueDate), iso(resolveDraftDates(base).dueDate)], ["2026-11-01", "2026-11-10"]);
const late = resolveDraftDates({ ...base, today: day("2026-11-12") });
assert.deepEqual([iso(late.issueDate), iso(late.dueDate)], ["2026-11-12", "2026-11-17"]);
const chosen = resolveDraftDates({ ...base, explicitDue: day("2026-11-30"), explicitIssue: day("2026-11-05") });
assert.deepEqual([iso(chosen.issueDate), iso(chosen.dueDate)], ["2026-11-05", "2026-11-30"]);
assert.equal(iso(resolveDraftDates({ ...base, explicitDue: day("2026-10-31") }).dueDate), "2026-11-10");
assert.equal(resolveDraftDates({ ...base, paymentForm: 1 }).dueDate, null);

// --- Al guardar, solo lo que difiere de la regla queda guardado.
const rule = { period: nov, today: day("2026-10-30") };
assert.deepEqual(pickExplicitDates({ dueDate: "2026-11-10", issueDate: "2026-11-01", paymentForm: 2 }, rule), { dueDate: null, issueDate: null });
const picked = pickExplicitDates({ dueDate: "2026-11-20", issueDate: "2026-11-15", paymentForm: 2 }, rule);
assert.deepEqual([iso(picked.issueDate), iso(picked.dueDate)], ["2026-11-15", null], "el 15 vence el 20 por la regla");
assert.equal(iso(pickExplicitDates({ dueDate: "2026-11-30", issueDate: "2026-11-01", paymentForm: 2 }, rule).dueDate), "2026-11-30");
assert.deepEqual(pickExplicitDates({ dueDate: "2026-11-30", issueDate: "2026-11-01", paymentForm: 1 }, rule), { dueDate: null, issueDate: null });
assert.equal(getPaymentLabel(2, day("2026-12-10")), "Crédito · vence 10/12");

// --- El lote: un borrador de diciembre emitido el 1 de noviembre sale con
// fecha 1 de diciembre (cuenta en diciembre) y vence el 10; una con fechas
// elegidas sale con esas; una de contado, sin vencimiento.
export const billingDatesChecks = (async () => {
  const sent: Record<string, unknown>[] = [];
  const saved: IssueOutcome[] = [];
  const receiver = { tipo_documento: 2, documento: "219999990019", razon_social: "Cliente", nombre_fantasia: null, sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY" } };
  const candidate = (id: string, patch: Partial<IssueCandidate> = {}): IssueCandidate => ({
    adenda: null, batchId: "b", cfeType: 111, currency: "UYU", dueDays: 31, id, internalNumber: `BAMBU-${id}`, issueDate: null,
    items: [{ codigo: null, cantidad: 1, concepto: "Limpieza", descripcion: null, precio: 1000, indicador_facturacion: 3, unidad_medida: null }],
    paymentForm: 2, period: dec, receiver, ...patch,
  });
  const queue = [candidate("a"), candidate("b", { dueDate: day("2026-12-20"), issueDate: day("2026-12-05") }), candidate("c", { paymentForm: 1 })];
  const issuer: BillerIssuer = { issue: async (payload) => (sent.push(payload), { billerId: sent.length, number: sent.length, series: "A" }) };
  let clock = day("2026-11-01").getTime() + 15 * 3600_000;
  await runBatchIssue("b", {
    findByInternalNumber: async () => null,
    issuer,
    now: () => new Date(clock),
    sleep: async (ms) => { clock += ms; },
    store: {
      failRemaining: async () => 0,
      finishBatch: async () => undefined,
      nextIssuing: async (_batch, skip) => queue.find((item) => !skip.includes(item.id)) ?? null,
      saveOutcome: async (_candidate, outcome) => { saved.push(outcome); },
    },
  });
  assert.deepEqual(sent.map((payload) => [payload.fecha_emision, payload.fecha_vencimiento ?? null, payload.forma_pago]), [
    ["01/12/2026", "10/12/2026", 2],
    ["05/12/2026", "20/12/2026", 2],
    ["01/12/2026", null, 1],
  ]);
  assert.equal(saved[0].kind === "issued" && iso(saved[0].issueDate), "2026-12-01", "se guarda con la fecha con que salió");
})();
