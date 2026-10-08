import type { AgentReasoning, ModeDefaults } from "@/lib/ai/modes";
import { estimateUsageCost } from "@/lib/ai/pricing";
import type { NormalizedUsage } from "@/lib/ai/usage";

// Lo que costó un mensaje del usuario: la suma de sus consumos (turno y
// habilidades), con el modelo y razonamiento del turno. Módulo puro.
export type MessageUsageSample = NormalizedUsage & {
  modelId: string;
  reasoning: string | null;
  costUsd: number | null;
};

// Con al menos estos mensajes del mismo modelo y razonamiento, el estimado es
// su promedio real.
export const MIN_SAMPLES_FOR_AVERAGE = 5;

// Sin historial suficiente se arma con el uso típico de un mensaje (contexto,
// caché y respuesta) más estos tokens de razonamiento según el nivel. Salen
// de lo medido con gpt-6 (xhigh promedia entre 1.700 y 2.900 por mensaje).
const TYPICAL_REASONING_TOKENS: Record<AgentReasoning, number> = {
  "provider-default": 1000,
  none: 0,
  minimal: 100,
  low: 250,
  medium: 1000,
  high: 2000,
  xhigh: 3000,
};

const average = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

const roundUsd = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

// Costo estimado de un mensaje con este modelo y razonamiento, o null si no
// hay con qué estimarlo (sin historial o sin precio para el modelo).
export const estimateMessageCost = (
  spec: ModeDefaults,
  samples: MessageUsageSample[]
): number | null => {
  const sameSpec = samples.flatMap((sample) =>
    sample.modelId === spec.modelId && sample.reasoning === spec.reasoning && sample.costUsd !== null
      ? [sample.costUsd]
      : []
  );
  if (sameSpec.length >= MIN_SAMPLES_FOR_AVERAGE) return roundUsd(average(sameSpec));
  if (!samples.length) return null;

  const mean = (pick: (sample: MessageUsageSample) => number) => average(samples.map(pick));
  const visibleOutput = mean((sample) => Math.max(sample.outputTokens - sample.reasoningTokens, 0));
  const reasoningTokens = TYPICAL_REASONING_TOKENS[spec.reasoning];
  const typical: NormalizedUsage = {
    inputTokens: mean((sample) => sample.inputTokens),
    cachedInputTokens: mean((sample) => sample.cachedInputTokens),
    cacheWriteTokens: mean((sample) => sample.cacheWriteTokens),
    outputTokens: visibleOutput + reasoningTokens,
    reasoningTokens,
  };
  return estimateUsageCost(spec.modelId, typical).costUsd;
};
