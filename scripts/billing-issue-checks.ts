import assert from "node:assert/strict";

import { isBillerIssueEnabled, type BillerConfig } from "../lib/billing/biller-config";
import { BillerError } from "../lib/billing/biller-errors";
import { createBillerIssuer, isDuplicateInternalNumber, type BillerIssuer } from "../lib/billing/biller-issue";
import type { BillerInvoice } from "../lib/billing/biller-schemas";
import { buildIssuePlan, getIssueDay, type IssueInput } from "../lib/billing/issue-payload";
import { ISSUE_SPACING_MS, runBatchIssue, type IssueCandidate, type IssueOutcome } from "../lib/billing/issue-run";
import { eFacturaRow } from "./billing-fixtures";

// Feature 41: emitir lo marcado de un borrador, de a uno y sin duplicar.
const day = getIssueDay(new Date("2026-10-31T02:00:00Z"));
assert.equal(day.toISOString(), "2026-10-30T00:00:00.000Z", "Montevideo sigue en el 30 a las 23:00");

const rut = { tipo_documento: 2, documento: "219667740019", razon_social: "DGI RUC PRUEBA CEDE", nombre_fantasia: null,
  sucursal: { direccion: "Daniel Fernández Crespo 1534", ciudad: "Montevideo", departamento: null, pais: "UY" } };
const item = { codigo: null, cantidad: 1, concepto: "Limpieza - noviembre 2026", descripcion: null, precio: 12000,
  indicador_facturacion: 3, unidad_medida: null };
const input = (patch: Partial<IssueInput> = {}): IssueInput => ({
  adenda: "Servicio de noviembre", cfeType: 111, currency: "UYU", dueDays: 31, internalNumber: "BAMBU-a",
  items: [item], paymentForm: 2, receiver: rut, ...patch,
});

// --- El pedido: fechas dd/mm/aaaa, vencimiento con los mismos días, sin nulls.
const plan = buildIssuePlan(input(), day);
assert.ok(plan.ok);
assert.deepEqual(plan.payload, {
  adenda: "Servicio de noviembre",
  cliente: { tipo_documento: 2, documento: "219667740019", razon_social: "DGI RUC PRUEBA CEDE",
    sucursal: { direccion: "Daniel Fernández Crespo 1534", ciudad: "Montevideo", pais: "UY" } },
  fecha_emision: "30/10/2026", fecha_vencimiento: "30/11/2026", forma_pago: 2,
  items: [{ cantidad: 1, concepto: "Limpieza - noviembre 2026", precio: 12000, indicador_facturacion: 3 }],
  moneda: "UYU", montos_brutos: 0, numero_interno: "BAMBU-a", tipo_comprobante: 111,
});
const ticket = buildIssuePlan(input({ cfeType: 101, paymentForm: 1, receiver: null, adenda: null }), day);
assert.ok(ticket.ok && ticket.payload.cliente === "-" && !("fecha_vencimiento" in ticket.payload) && !("adenda" in ticket.payload));
const errorOf = (patch: Partial<IssueInput>) => {
  const result = buildIssuePlan(input(patch), day);
  return result.ok ? null : result.error;
};
assert.match(errorOf({ receiver: { ...rut, tipo_documento: 3, documento: "47395795" } })!, /RUT de 12/);
assert.match(errorOf({ items: [] })!, /ítems/);
assert.match(errorOf({ items: [{ ...item, precio: 0 }] })!, /montos/);
assert.match(errorOf({ internalNumber: null })!, /número interno/);
assert.match(errorOf({ cfeType: 102 })!, /notas de crédito/);

assert.equal(isBillerIssueEnabled({}), true);
assert.equal(isBillerIssueEnabled({ BILLER_ISSUE_ENABLED: "false" }), false);
assert.equal(isBillerIssueEnabled({ BILLER_ISSUE_ENABLED: " 0 " }), false);
assert.equal(isBillerIssueEnabled({ BILLER_ISSUE_ENABLED: "true" }), true);

// --- El cliente: POST a emitir con la sucursal, reintenta un 429, lee el número.
const config: BillerConfig = { baseUrl: "https://test.biller.uy", environment: "test", sucursal: 928, token: "t" };
const issuerChecks = (async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const replies = [
    new Response("", { status: 429, headers: { "x-rate-limit-reset": "1" } }),
    new Response(JSON.stringify({ id: 43574, serie: "C", numero: "2055262", hash: "x" }), { status: 201 }),
  ];
  const issuer = createBillerIssuer(config, {
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return replies.shift()!;
    },
    sleep: async () => undefined,
  });
  assert.deepEqual(await issuer.issue(plan.ok ? plan.payload : (null as never)), { billerId: 43574, number: 2055262, series: "C" });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://test.biller.uy/v3/comprobantes/emitir");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(JSON.parse(String(calls[0].init?.body)).sucursal, 928);

  const failing = createBillerIssuer(config, { fetch: async () => { throw new TypeError("timeout"); }, sleep: async () => undefined });
  await assert.rejects(failing.issue({} as never), (error: BillerError) => error.kind === "network");
  const duplicate = createBillerIssuer(config, {
    fetch: async () => new Response(JSON.stringify([{ field: "Comprobantes[numero_interno]", message: ["Número interno no puede estar repetido"] }]), { status: 422 }),
    sleep: async () => undefined,
  });
  await assert.rejects(duplicate.issue({} as never), (error) => isDuplicateInternalNumber(error));
})();

// --- El emisor de lotes con un Biller y una base falsos.
type Script = ((payload: { numero_interno: string }) => unknown)[];
const run = async (candidates: IssueCandidate[], script: Script, found: Record<string, BillerInvoice> = {}) => {
  let clock = Date.parse("2026-10-30T15:00:00Z");
  const sends: { at: number; internal: string }[] = [];
  const saved = new Map<string, IssueOutcome>();
  const queue = [...candidates];
  let finished = 0;
  const issuer: BillerIssuer = {
    issue: async (payload) => {
      sends.push({ at: clock, internal: payload.numero_interno });
      const step = script.shift();
      if (!step) throw new Error("Biller falso sin respuesta");
      const result = step(payload);
      if (result instanceof Error) throw result;
      return result as Awaited<ReturnType<BillerIssuer["issue"]>>;
    },
  };
  const result = await runBatchIssue("batch", {
    findByInternalNumber: async (internal) => found[internal] ?? null,
    issuer,
    now: () => new Date(clock),
    sleep: async (ms) => { clock += ms; },
    store: {
      nextIssuing: async (_batch, skip) => queue.find((candidate) => !skip.includes(candidate.id) && !saved.has(candidate.id)) ?? null,
      saveOutcome: async (candidate, outcome) => { saved.set(candidate.id, outcome); },
      failRemaining: async (_batch, message) => {
        const rest = queue.filter((candidate) => !saved.has(candidate.id));
        rest.forEach((candidate) => saved.set(candidate.id, { kind: "failed", message }));
        return rest.length;
      },
      finishBatch: async () => { finished += 1; },
    },
  });
  return { finished, result, saved, sends };
};

const candidate = (id: string, patch: Partial<IssueInput> = {}): IssueCandidate => ({ ...input({ internalNumber: `BAMBU-${id}`, ...patch }), batchId: "batch", id });
const ok = (number: number) => () => ({ billerId: 900 + number, number, series: "MF" });
const timeout = () => new BillerError("network", "timeout");
const duplicateError = new BillerError("validation", "repetido", {
  status: 422, fields: [{ field: "Comprobantes[numero_interno]", messages: ["Número interno no puede estar repetido"] }],
});
const existing = { ...eFacturaRow, numero_interno: "BAMBU-b", estado: "Aceptado DGI" } as unknown as BillerInvoice;

const runChecks = (async () => {
  // Bien; repetido en Biller (se toma el que existe); timeout que no llegó (se reenvía).
  const first = await run([candidate("a"), candidate("b"), candidate("c")], [ok(1), () => duplicateError, timeout, ok(3)], { "BAMBU-b": existing });
  assert.deepEqual(first.result, { failed: 0, issued: 3, unknown: 0 });
  assert.equal(first.saved.get("b")?.kind, "found");
  assert.deepEqual(first.sends.map((send) => send.internal), ["BAMBU-a", "BAMBU-b", "BAMBU-c", "BAMBU-c"]);
  first.sends.slice(1).forEach((send, index) => assert.ok(send.at - first.sends[index].at >= ISSUE_SPACING_MS, "1 por segundo"));
  assert.equal(first.finished, 1);

  // Un timeout que sí llegó: se encuentra por numero_interno y no se reenvía.
  const arrived = await run([candidate("b")], [timeout], { "BAMBU-b": existing });
  assert.equal(arrived.saved.get("b")?.kind, "found");
  assert.equal(arrived.sends.length, 1);

  // Dos timeouts sin rastro en Biller: UNKNOWN, nunca un tercer envío.
  const lost = await run([candidate("a")], [timeout, timeout]);
  assert.deepEqual(lost.result, { failed: 0, issued: 0, unknown: 1 });
  assert.equal(lost.sends.length, 2);

  // Un rechazo de datos no frena el resto; lo que falta se dice sin llamar a Biller.
  const mixed = await run(
    [candidate("a"), candidate("x", { receiver: null }), candidate("c")],
    [() => new BillerError("validation", "Indicador Facturación es inválido"), ok(3)]
  );
  assert.deepEqual(mixed.result, { failed: 2, issued: 1, unknown: 0 });
  assert.match((mixed.saved.get("a") as { message: string }).message, /Indicador/);
  assert.match((mixed.saved.get("x") as { message: string }).message, /RUT/);
  assert.equal(mixed.sends.length, 2);

  // Sin permiso no sale ninguna: se frena el lote al primer intento.
  const denied = await run([candidate("a"), candidate("b"), candidate("c")], [() => new BillerError("unauthorized", "token")]);
  assert.deepEqual(denied.result, { failed: 3, issued: 0, unknown: 0 });
  assert.equal(denied.sends.length, 1);
  assert.equal(denied.finished, 1);
})();

export const billingIssueChecks = Promise.all([issuerChecks, runChecks]);
