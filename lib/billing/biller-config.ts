import { BillerError } from "@/lib/billing/biller-errors";

export const BILLER_TEST_URL = "https://test.biller.uy";
export const BILLER_PRODUCTION_URL = "https://biller.uy";

export type BillerEnvironment = "test" | "production";

export type BillerConfig = {
  baseUrl: string;
  environment: BillerEnvironment;
  sucursal: number;
  token: string;
};

export type BillerEnv = Partial<
  Record<
    | "BILLER_ALLOW_LOCAL_PRODUCTION"
    | "BILLER_BASE_URL"
    | "BILLER_ISSUE_ENABLED"
    | "BILLER_SUCURSAL"
    | "BILLER_TOKEN"
    | "VERCEL_ENV",
    string | undefined
  >
>;

const clean = (value: string | undefined) => value?.trim() || undefined;

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

  return { baseUrl, environment, sucursal, token };
};

// Emitir se apaga con BILLER_ISSUE_ENABLED=false (también "0" u "off") sin
// tocar la lectura. Sin la variable, emitir está prendido.
export const isBillerIssueEnabled = (env: Pick<BillerEnv, "BILLER_ISSUE_ENABLED">) =>
  !/^(false|0|off|no)$/i.test(clean(env.BILLER_ISSUE_ENABLED) ?? "");
