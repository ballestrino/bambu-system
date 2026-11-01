import type { BillerConfig } from "@/lib/billing/biller-config";
import { BillerError, billerErrorFromResponse } from "@/lib/billing/biller-errors";
import { defaultHttpDeps, parseBody, retryDelayMs, type HttpDeps } from "@/lib/billing/biller-http";
import type { IssuePayload } from "@/lib/billing/issue-payload";

// La única escritura en Biller (docs/billing.md, regla 1): emitir un CFE. El
// agente nunca importa este módulo ni la acción que lo usa (check:billing).
// Anular llega con la 43.
const ISSUE_PATH = "/v3/comprobantes/emitir";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

export type IssuedCfe = { billerId: number; number: number; series: string };

export type BillerIssuer = { issue: (payload: IssuePayload) => Promise<IssuedCfe> };

const readIssued = (body: unknown): IssuedCfe | null => {
  if (!body || typeof body !== "object") return null;
  const { id, numero, serie } = body as { id?: unknown; numero?: unknown; serie?: unknown };
  const billerId = Number(id);
  const number = Number(numero);
  if (!Number.isInteger(billerId) || !Number.isInteger(number) || typeof serie !== "string") return null;
  return { billerId, number, series: serie };
};

// Un 429 no creó nada: se reintenta con espera. Un timeout, un 5xx o una
// respuesta ilegible pueden haber creado el comprobante: no se reintenta acá,
// lo decide quien emite después de buscarlo por numero_interno (regla 3).
export const createBillerIssuer = (config: BillerConfig, deps: HttpDeps = defaultHttpDeps): BillerIssuer => ({
  issue: async (payload) => {
    const url = new URL(ISSUE_PATH, config.baseUrl);
    for (let attempt = 1; ; attempt += 1) {
      let response: Response;
      try {
        response = await deps.fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...payload, sucursal: config.sucursal }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: "no-store",
        });
      } catch {
        throw new BillerError("network", "No se pudo confirmar la emisión con Biller");
      }

      if (response.status === 429 && attempt < MAX_ATTEMPTS) {
        await deps.sleep(retryDelayMs(response));
        continue;
      }

      const body = parseBody(await response.text());
      if (!response.ok) throw billerErrorFromResponse(response.status, body);
      const issued = readIssued(body);
      if (!issued) throw new BillerError("invalid_response", "Biller no devolvió el número del comprobante");
      return issued;
    }
  },
});

// Si el comprobante pudo haberse creado aunque no haya respuesta clara.
export const isUncertainIssueError = (error: unknown) =>
  error instanceof BillerError && ["network", "server", "invalid_response"].includes(error.kind);

// Biller rechaza un numero_interno repetido con un 422 (probado en test): el
// comprobante ya existe, se busca y se toma ese.
export const isDuplicateInternalNumber = (error: unknown) =>
  error instanceof BillerError &&
  error.kind === "validation" &&
  error.fields.some(
    (field) => /numero_interno/i.test(field.field) && field.messages.some((message) => /repetid/i.test(message))
  );

// Sin token, sin permiso o sin configuración no sale ninguna: se frena el lote.
export const isFatalIssueError = (error: unknown) =>
  error instanceof BillerError && ["not_configured", "invalid_config", "unauthorized", "forbidden"].includes(error.kind);
