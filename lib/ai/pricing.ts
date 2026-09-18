import { readAiEnv, type AiEnv } from "@/lib/ai/model-spec";
import type { NormalizedUsage } from "@/lib/ai/usage";

// Precio en USD por millón de tokens. Módulo puro.
export type ModelPrice = {
  inputPerMillion: number;
  cachedInputPerMillion: number;
  cacheWritePerMillion: number;
  outputPerMillion: number;
};

// Tier Standard y contexto corto de OpenAI, tomados de
// https://developers.openai.com/api/docs/pricing el 2026-09-18. La escritura
// de caché se cobra 1,25 veces la entrada. Por encima de 272K tokens de
// entrada OpenAI cobra el doble de entrada y 1,5 veces la salida; no se modela
// porque el agente recorta el historial muy por debajo de ese tope.
export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
  "gpt-5.6-luna": {
    inputPerMillion: 0.2,
    cachedInputPerMillion: 0.02,
    cacheWritePerMillion: 0.25,
    outputPerMillion: 1.2,
  },
  "gpt-5.6-terra": {
    inputPerMillion: 2,
    cachedInputPerMillion: 0.2,
    cacheWritePerMillion: 2.5,
    outputPerMillion: 12,
  },
  "gpt-5.6-sol": {
    inputPerMillion: 4,
    cachedInputPerMillion: 0.4,
    cacheWritePerMillion: 5,
    outputPerMillion: 20,
  },
};

export type UsageCost = { costUsd: number | null; priced: boolean };

// "openai/gpt-5.6-terra" -> "AI_PRICE_OPENAI_GPT_5_6_TERRA".
export const getPriceEnvKey = (modelId: string) =>
  `AI_PRICE_${modelId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;

// Formato: "entrada,cacheada,salida[,escritura de caché]", con punto decimal.
// Sin el cuarto valor, la escritura de caché se cobra como entrada.
const parsePriceOverride = (key: string, raw: string): ModelPrice => {
  const values = raw.split(",").map((part) => Number(part.trim()));
  const valid =
    (values.length === 3 || values.length === 4) &&
    values.every((value) => Number.isFinite(value) && value >= 0);
  if (!valid) {
    throw new Error(
      `${key} inválido: "${raw}". Formato: entrada,cacheada,salida[,escritura] en USD por millón, con punto decimal.`
    );
  }
  const [input, cachedInput, output, cacheWrite = input] = values;
  return {
    inputPerMillion: input,
    cachedInputPerMillion: cachedInput,
    cacheWritePerMillion: cacheWrite,
    outputPerMillion: output,
  };
};

// Con el gateway los ids de OpenAI llegan como "openai/<modelo>" y comparten
// precio con el id directo. Un override de entorno gana sobre la tabla.
export const resolveModelPrice = (
  modelId: string,
  env: AiEnv = process.env
): ModelPrice | null => {
  const bareId = modelId.replace(/^openai\//, "");
  for (const id of new Set([modelId, bareId])) {
    const key = getPriceEnvKey(id);
    const override = readAiEnv(env, key);
    if (override) return parsePriceOverride(key, override);
  }
  return Object.hasOwn(MODEL_PRICES, bareId) ? MODEL_PRICES[bareId] : null;
};

const roundUsd = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

export const estimateUsageCost = (
  modelId: string,
  usage: NormalizedUsage,
  env: AiEnv = process.env
): UsageCost => {
  const price = resolveModelPrice(modelId, env);
  if (!price) return { costUsd: null, priced: false };

  const uncachedInput = Math.max(
    usage.inputTokens - usage.cachedInputTokens - usage.cacheWriteTokens,
    0
  );
  const microUsd =
    uncachedInput * price.inputPerMillion +
    usage.cachedInputTokens * price.cachedInputPerMillion +
    usage.cacheWriteTokens * price.cacheWritePerMillion +
    usage.outputTokens * price.outputPerMillion;

  return { costUsd: roundUsd(microUsd / 1_000_000), priced: true };
};

const usdFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const smallUsdFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const SMALLEST_SHOWN_USD = 0.0001;

// "US$ 0,03". Un turno barato no puede mostrarse como "US$ 0,00": debajo de
// un centavo se muestran hasta cuatro decimales, y debajo de eso, el tope.
export const formatUsd = (value: number) => {
  if (value > 0 && value < SMALLEST_SHOWN_USD) {
    return `< ${smallUsdFormatter.format(SMALLEST_SHOWN_USD)}`;
  }
  return (value > 0 && value < 0.01 ? smallUsdFormatter : usdFormatter).format(value);
};
