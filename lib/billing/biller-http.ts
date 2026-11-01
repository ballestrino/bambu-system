import type { BillerConfig } from "@/lib/billing/biller-config";
import { BillerError, billerErrorFromResponse } from "@/lib/billing/biller-errors";

// Solo lectura. Emitir (también las notas de crédito) vive en biller-issue.ts y
// el agente nunca lo importa (check:billing). Este GET rechaza cualquier ruta
// fuera de la lista.
export const BILLER_READ_PATHS = [
  "/v2/comprobantes/obtener",
  "/v3/comprobantes/detalle",
  "/v2/dgi/empresas/datos-entidad",
  "/v2/comprobantes/pdf",
] as const;

export type BillerReadPath = (typeof BILLER_READ_PATHS)[number];
export type BillerQuery = Record<string, string | number | undefined>;
export type BillerGet = (path: BillerReadPath, query?: BillerQuery) => Promise<unknown>;
export type BillerGetText = (path: BillerReadPath, query?: BillerQuery) => Promise<string>;

export type HttpDeps = {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
};

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;

export const defaultHttpDeps: HttpDeps = {
  fetch: (...args) => fetch(...args),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const buildUrl = (baseUrl: string, path: string, query: BillerQuery = {}) => {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
};

export const parseBody = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

// Biller limita a 1 llamado por segundo los de DGI y a 30 el resto. Un 429 se
// reintenta después de X-Rate-Limit-Reset (en segundos), hasta 3 intentos.
export const retryDelayMs = (response: Response) => {
  const reset = Number(response.headers.get("x-rate-limit-reset"));
  return (Number.isFinite(reset) && reset > 0 ? reset : 1) * 1000 + 100;
};

// GET con los reintentos ante un 429; devuelve el texto de una respuesta 2xx.
const createGetText = (config: BillerConfig, deps: HttpDeps): BillerGetText =>
  async (path, query) => {
    if (!BILLER_READ_PATHS.includes(path)) {
      throw new BillerError("invalid_config", `Ruta de Biller no permitida: ${path}`);
    }
    const url = buildUrl(config.baseUrl, path, query);

    for (let attempt = 1; ; attempt += 1) {
      let response: Response;
      try {
        response = await deps.fetch(url, {
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${config.token}` },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: "no-store",
        });
      } catch {
        throw new BillerError("network", "No se pudo conectar con Biller");
      }

      if (response.status === 429 && attempt < MAX_ATTEMPTS) {
        await deps.sleep(retryDelayMs(response));
        continue;
      }

      const text = await response.text();
      if (!response.ok) throw billerErrorFromResponse(response.status, parseBody(text));
      return text;
    }
  };

export const createBillerGet = (config: BillerConfig, deps: HttpDeps = defaultHttpDeps): BillerGet => {
  const getText = createGetText(config, deps);
  return async (path, query) => {
    const body = parseBody(await getText(path, query));
    if (body === null || typeof body === "string") {
      throw new BillerError("invalid_response", "Biller no devolvió JSON");
    }
    return body;
  };
};

// El PDF llega como base64 en texto plano (o como un string JSON).
export const createBillerGetText = (config: BillerConfig, deps: HttpDeps = defaultHttpDeps) =>
  createGetText(config, deps);
