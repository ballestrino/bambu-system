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
// https://developers.openai.com/api/docs/pricing (gpt-6 el 2026-09-23,
// gpt-5.6 el 2026-09-18). La escritura de caché se cobra 1,25 veces la
// entrada. Por encima de 272K tokens de entrada OpenAI cobra el doble de
// entrada y 1,5 veces la salida; no se modela porque el agente recorta el
// historial muy por debajo de ese tope.
// gpt-5.6 queda para volver a un modo con AI_MODEL_*. El precio de
// gpt-5.6-sol es promocional "at least through November 21, 2026": si
// cambia, actualizar la tabla o fijarlo con AI_PRICE_GPT_5_6_SOL.
export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = {
  // https://developers.openai.com/api/docs/models/gpt-6.1-sol (2026-09-29).
  "gpt-6.1-sol": {
    inputPerMillion: 2,
    cachedInputPerMillion: 0.1,
    cacheWritePerMillion: 2.5,
    outputPerMillion: 10,
  },
  "gpt-6-luna": {
    inputPerMillion: 0.1,
    cachedInputPerMillion: 0.01,
    cacheWritePerMillion: 0.125,
    outputPerMillion: 0.5,
  },
  "gpt-6-sol": {
    inputPerMillion: 2,
    cachedInputPerMillion: 0.2,
    cacheWritePerMillion: 2.5,
    outputPerMillion: 10,
  },
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

// "openai/gpt-6-luna" -> "AI_PRICE_OPENAI_GPT_6_LUNA".
export const getPriceEnvKey = (modelId: string) =>
  `AI_PRICE_${modelId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;

// Sin el cuarto valor, la escritura de caché se cobra como en gpt-6 y gpt-5.6.
const DEFAULT_CACHE_WRITE_MULTIPLIER = 1.25;

// Un número con punto decimal, sin signo, exponente ni hexadecimal. Number()
// solo no alcanza: Number("") es 0 y un campo vacío inventaría un precio.
const PRICE_PART = /^\d+(\.\d+)?$/;

// Formato: "entrada,cacheada,salida[,escritura de caché]". Un campo vacío o
// mal escrito lanza un error que nombra la variable.
const parsePriceOverride = (key: string, raw: string): ModelPrice => {
  const parts = raw.split(",").map((part) => part.trim());
  const valid =
    (parts.length === 3 || parts.length === 4) && parts.every((part) => PRICE_PART.test(part));
  if (!valid) {
    throw new Error(
      `${key} inválido: "${raw}". Formato: entrada,cacheada,salida[,escritura] en USD por millón, con punto decimal.`
    );
  }
  const [input, cachedInput, output, cacheWrite = input * DEFAULT_CACHE_WRITE_MULTIPLIER] =
    parts.map(Number);
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

// Dictado: USD por minuto de audio, de la misma página de precios
// (2026-10-08). OpenAI cobra por segundo, sin mínimo.
export const TRANSCRIPTION_PRICES_PER_MINUTE: Readonly<Record<string, number>> = {
  "gpt-transcribe": 0.0045,
  "gpt-4o-transcribe": 0.006,
  "gpt-4o-mini-transcribe": 0.003,
  "whisper-1": 0.006,
};

export const estimateTranscriptionCost = (modelId: string, seconds: number): UsageCost => {
  const bareId = modelId.replace(/^openai\//, "");
  if (!Object.hasOwn(TRANSCRIPTION_PRICES_PER_MINUTE, bareId)) return { costUsd: null, priced: false };
  return { costUsd: roundUsd((Math.max(seconds, 0) / 60) * TRANSCRIPTION_PRICES_PER_MINUTE[bareId]), priced: true };
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
