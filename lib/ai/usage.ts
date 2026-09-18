import type { LanguageModelUsage, ProviderMetadata } from "ai";

// Forma propia del consumo de tokens. Aísla la del SDK: en v7 los cacheados y
// el razonamiento vienen anidados en inputTokenDetails y outputTokenDetails.
// Solo importa tipos, así que en runtime sigue siendo puro.
export type NormalizedUsage = {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
};

export const EMPTY_USAGE: NormalizedUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cachedInputTokens: 0,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
};

const USAGE_FIELDS = Object.keys(EMPTY_USAGE) as (keyof NormalizedUsage)[];

const toTokenCount = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;

// inputTokens incluye los cacheados y outputTokens incluye el razonamiento,
// igual que en la factura: el costo se calcula con esos totales.
export const normalizeUsage = (
  usage: LanguageModelUsage | undefined
): NormalizedUsage => ({
  inputTokens: toTokenCount(usage?.inputTokens),
  outputTokens: toTokenCount(usage?.outputTokens),
  cachedInputTokens: toTokenCount(usage?.inputTokenDetails?.cacheReadTokens),
  cacheWriteTokens: toTokenCount(usage?.inputTokenDetails?.cacheWriteTokens),
  reasoningTokens: toTokenCount(usage?.outputTokenDetails?.reasoningTokens),
});

export const sumUsage = (...items: NormalizedUsage[]): NormalizedUsage =>
  items.reduce(
    (total, item) =>
      Object.fromEntries(
        USAGE_FIELDS.map((field) => [field, total[field] + item[field]])
      ) as NormalizedUsage,
    EMPTY_USAGE
  );

// El AI Gateway informa el costo real de cada llamada en
// providerMetadata.gateway.cost, como string decimal en USD. Es por llamada:
// en un turno con varios pasos hay que leerlo en cada paso y sumarlo.
export const readGatewayCost = (
  providerMetadata: ProviderMetadata | undefined
): number | null => {
  const raw = providerMetadata?.gateway?.cost;
  const value =
    typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
};
