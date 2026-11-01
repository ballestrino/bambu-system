import assert from "node:assert/strict";

import { BILLER_PRODUCTION_URL, BILLER_TEST_URL, resolveBillerConfig } from "../lib/billing/biller-config";
import { BillerError, describeBillerError } from "../lib/billing/biller-errors";
import { createBillerGet, type BillerReadPath } from "../lib/billing/biller-http";

const kindOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error instanceof BillerError ? error.kind : "other";
  }
  return "ok";
};

// --- Config: vacío no está configurado; producción solo en el deploy de producción o con la llave.
const test = { BILLER_BASE_URL: `${BILLER_TEST_URL}/`, BILLER_TOKEN: "t0k3n", BILLER_SUCURSAL: "928" };
const config = resolveBillerConfig(test);
assert.deepEqual(config, { baseUrl: BILLER_TEST_URL, environment: "test", sucursal: 928, token: "t0k3n" });
assert.equal(kindOf(() => resolveBillerConfig({ ...test, BILLER_TOKEN: " " })), "not_configured");
assert.equal(kindOf(() => resolveBillerConfig({})), "not_configured");
assert.equal(kindOf(() => resolveBillerConfig({ ...test, BILLER_BASE_URL: "https://otro.biller.uy" })), "invalid_config");
assert.equal(kindOf(() => resolveBillerConfig({ ...test, BILLER_SUCURSAL: "Principal" })), "invalid_config");
const production = { ...test, BILLER_BASE_URL: BILLER_PRODUCTION_URL };
assert.equal(kindOf(() => resolveBillerConfig(production)), "invalid_config");
assert.equal(kindOf(() => resolveBillerConfig({ ...production, VERCEL_ENV: "preview" })), "invalid_config");
assert.equal(resolveBillerConfig({ ...production, VERCEL_ENV: "production" }).environment, "production");
assert.equal(resolveBillerConfig({ ...production, BILLER_ALLOW_LOCAL_PRODUCTION: "1" }).environment, "production");

// --- HTTP: solo GET, solo rutas de lectura, reintento ante 429 y errores tipados.
type Call = { url: string; init?: RequestInit };
const fakeFetch = (responses: Array<() => Response>, calls: Call[]) =>
  (async (url: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error("no response left");
    return next();
  }) as typeof fetch;
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  () => new Response(JSON.stringify(body), { status, headers });

const run = async () => {
  const calls: Call[] = [];
  const sleeps: number[] = [];
  const sleep = async (ms: number) => void sleeps.push(ms);

  const blocked = createBillerGet(config, { fetch: fakeFetch([], calls), sleep });
  await assert.rejects(blocked("/v3/comprobantes/emitir" as BillerReadPath), (error: BillerError) => error.kind === "invalid_config");
  assert.equal(calls.length, 0);

  const retried = createBillerGet(config, {
    fetch: fakeFetch([json(429, {}, { "x-rate-limit-reset": "1" }), json(200, [])], calls),
    sleep,
  });
  assert.deepEqual(await retried("/v2/comprobantes/obtener", { desde: "2026-10-01 00:00:00", hasta: undefined }), []);
  assert.equal(calls.length, 2);
  assert.deepEqual(sleeps, [1100]);
  assert.equal(calls[1].init?.method, "GET");
  assert.equal((calls[1].init?.headers as Record<string, string>).Authorization, "Bearer t0k3n");
  assert.equal(calls[1].url, `${BILLER_TEST_URL}/v2/comprobantes/obtener?desde=2026-10-01+00%3A00%3A00`);

  const failing = (response: () => Response) =>
    createBillerGet(config, { fetch: fakeFetch([response], []), sleep })("/v3/comprobantes/detalle", { id: 1 });
  await assert.rejects(
    failing(json(422, [{ field: "Comprobantes[numero_interno]", message: ["Número interno no puede estar repetido"] }])),
    (error: BillerError) =>
      error.kind === "validation" && error.fields[0].messages[0] === "Número interno no puede estar repetido"
  );
  await assert.rejects(failing(json(401, { message: "Your request was made with invalid credentials." })), (error: BillerError) => error.kind === "unauthorized");
  await assert.rejects(failing(json(404, { message: "Comprobante no existe o no tiene acceso." })), (error: BillerError) => error.kind === "not_found");
  await assert.rejects(failing(() => new Response("<html>", { status: 200 })), (error: BillerError) => error.kind === "invalid_response");
  await assert.rejects(
    createBillerGet(config, { fetch: (async () => { throw new TypeError("fetch failed"); }) as typeof fetch, sleep })("/v2/comprobantes/obtener"),
    (error: BillerError) => error.kind === "network"
  );

  assert.match(describeBillerError(new BillerError("unauthorized", "x")), /token/);
  assert.match(describeBillerError(new BillerError("validation", "Debe especificar receptor")), /Debe especificar receptor/);
};

export const billingConfigChecks = run();
