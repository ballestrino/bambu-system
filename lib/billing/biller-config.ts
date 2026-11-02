import { BillerError } from "@/lib/billing/biller-errors";

export const BILLER_TEST_URL = "https://test.biller.uy";
export const BILLER_PRODUCTION_URL = "https://biller.uy";

export type BillerEnvironment = "test" | "production";

// CAE especial de DGI (Formato CFE v25.2, zona G, campos 5 y 6): 1 exonerado
// (con causal), 2 IVA mínimo, 3 Monotributo, 4 Monotributo Social MIDES.
// Biller lo pide en `cae` al emitir con esos CAE.
export type BillerCae = { causal_especial?: number; especial: number };

export type BillerConfig = {
  baseUrl: string;
  // Sin CAE especial (régimen general) no se manda `cae`.
  cae?: BillerCae;
  environment: BillerEnvironment;
  sucursal: number;
  token: string;
};

export type BillerEnv = Partial<
  Record<
    | "BILLER_ALLOW_LOCAL_PRODUCTION"
    | "BILLER_BASE_URL"
    | "BILLER_CAE_CAUSAL"
    | "BILLER_CAE_ESPECIAL"
    | "BILLER_ISSUE_ENABLED"
    | "BILLER_SUCURSAL"
    | "BILLER_TOKEN"
    | "VERCEL_ENV",
    string | undefined
  >
>;

const clean = (value: string | undefined) => value?.trim() || undefined;

// BILLER_CAE_ESPECIAL=2 para Bambú (IVA mínimo: indicador 16 en los ítems).
// La causal solo existe con el 1 (exonerado), y ahí es obligatoria.
const resolveBillerCae = (env: BillerEnv): BillerCae | undefined => {
  const especialText = clean(env.BILLER_CAE_ESPECIAL);
  const causalText = clean(env.BILLER_CAE_CAUSAL);
  if (!especialText) {
    if (causalText) throw new BillerError("invalid_config", "BILLER_CAE_CAUSAL va solo con BILLER_CAE_ESPECIAL=1.");
    return undefined;
  }
  const especial = Number(especialText);
  if (![1, 2, 3, 4].includes(especial)) {
    throw new BillerError("invalid_config", "BILLER_CAE_ESPECIAL tiene que ser 1, 2, 3 o 4 (2 es IVA mínimo).");
  }
  if (especial !== 1) {
    if (causalText) throw new BillerError("invalid_config", "BILLER_CAE_CAUSAL va solo con BILLER_CAE_ESPECIAL=1.");
    return { especial };
  }
  const causal = Number(causalText);
  if (!Number.isInteger(causal) || causal <= 0) {
    throw new BillerError("invalid_config", "Con BILLER_CAE_ESPECIAL=1 hace falta BILLER_CAE_CAUSAL (la causal de la exoneración).");
  }
  return { causal_especial: causal, especial };
};

// Una variable vacía cuenta como no configurada. Producción solo corre en el
// deploy de producción de Vercel o con BILLER_ALLOW_LOCAL_PRODUCTION=1: en
// local o en un preview, un .env copiado nunca emite en la empresa real.
export const resolveBillerConfig = (env: BillerEnv): BillerConfig => {
  const baseUrl = clean(env.BILLER_BASE_URL)?.replace(/\/+$/, "");
  const token = clean(env.BILLER_TOKEN);
  const sucursalText = clean(env.BILLER_SUCURSAL);

  if (!baseUrl || !token || !sucursalText) {
    throw new BillerError("not_configured", "Faltan variables de Biller");
  }

  const environment =
    baseUrl === BILLER_TEST_URL ? "test" : baseUrl === BILLER_PRODUCTION_URL ? "production" : null;
  if (!environment) {
    throw new BillerError(
      "invalid_config",
      `BILLER_BASE_URL tiene que ser ${BILLER_TEST_URL} o ${BILLER_PRODUCTION_URL}.`
    );
  }

  const productionAllowed =
    clean(env.VERCEL_ENV) === "production" || clean(env.BILLER_ALLOW_LOCAL_PRODUCTION) === "1";
  if (environment === "production" && !productionAllowed) {
    throw new BillerError(
      "invalid_config",
      "Biller de producción solo corre en el deploy de producción o con BILLER_ALLOW_LOCAL_PRODUCTION=1."
    );
  }

  const sucursal = Number(sucursalText);
  if (!Number.isInteger(sucursal) || sucursal <= 0) {
    throw new BillerError("invalid_config", "BILLER_SUCURSAL tiene que ser el ID numérico de la sucursal.");
  }

  const cae = resolveBillerCae(env);
  return { baseUrl, ...(cae ? { cae } : {}), environment, sucursal, token };
};

// Emitir se apaga con BILLER_ISSUE_ENABLED=false (también "0" u "off") sin
// tocar la lectura. Sin la variable, emitir está prendido.
export const isBillerIssueEnabled = (env: Pick<BillerEnv, "BILLER_ISSUE_ENABLED">) =>
  !/^(false|0|off|no)$/i.test(clean(env.BILLER_ISSUE_ENABLED) ?? "");
