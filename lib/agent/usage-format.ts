import type { TurnUsageSummary } from "@/lib/agent/usage-collector";
import {
  LEGACY_MODE_LABELS,
  REASONING_LABELS,
  formatModelLabel,
  type AgentReasoning,
  type RecordedAgentMode,
} from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";

// Cómo se muestran el modelo, los tokens y el costo en el Sheet. Puro: lo
// usan la línea de uso, el badge, los diálogos y el check.

export { formatModelLabel };

// "Luna 6 Extra alto". Los consumos anteriores al 2026-09-23 no guardaron el
// razonamiento y se muestran solo con el modelo.
export const formatModelWithReasoning = (modelId: string, reasoning: string | null) => {
  const label = reasoning && Object.hasOwn(REASONING_LABELS, reasoning)
    ? REASONING_LABELS[reasoning as AgentReasoning]
    : null;
  return label ? `${formatModelLabel(modelId)} ${label}` : formatModelLabel(modelId);
};

const integer = new Intl.NumberFormat("es-UY");
const decimal = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

// "850", "3,2k", "1,5M": la línea de uso tiene que ser corta.
export const formatTokenCount = (tokens: number) => {
  if (tokens < 1000) return integer.format(tokens);
  const thousands = Math.round(tokens / 100) / 10;
  if (thousands < 1000) return `${decimal.format(thousands)}k`;
  return `${decimal.format(Math.round(tokens / 100_000) / 10)}M`;
};

export const formatTokenTotal = (tokens: number) => integer.format(tokens);

// Sin precio configurado se dice, en vez de inventar un número. Si una parte
// sí tenía precio, se muestra esa parte.
export const formatUsageCost = (usage: { costUsd: number | null; priced: boolean }) => {
  if (usage.priced) return formatUsd(usage.costUsd ?? 0);
  if (usage.costUsd) return `${formatUsd(usage.costUsd)} + precio no configurado`;
  return "precio no configurado";
};

// Lo que va después del modelo: el esfuerzo del turno ("Alto") o, en los
// mensajes anteriores al 2026-10-09, el nombre del modo con que se pidió.
const formatTurnEffort = (usage: TurnUsageSummary, mode?: RecordedAgentMode) => {
  if (usage.reasoning && Object.hasOwn(REASONING_LABELS, usage.reasoning)) {
    return REASONING_LABELS[usage.reasoning];
  }
  return mode ? (LEGACY_MODE_LABELS[mode] ?? null) : null;
};

// "Haiku 5.5 · Alto · 3,2k tokens · US$ 0,03"
export const formatUsageLine = (usage: TurnUsageSummary, mode?: RecordedAgentMode) =>
  [
    formatModelLabel(usage.modelId),
    formatTurnEffort(usage, mode),
    `${formatTokenCount(usage.tokens.total)} tokens`,
    formatUsageCost(usage),
  ]
    .filter(Boolean)
    .join(" · ");

// El detalle para el tooltip de la línea: entrada (con caché) y salida (con
// razonamiento), que es como se cobra.
export const formatUsageDetail = ({ tokens }: TurnUsageSummary) =>
  [
    `Entrada ${formatTokenTotal(tokens.inputTokens)}`,
    tokens.cachedInputTokens ? `(${formatTokenTotal(tokens.cachedInputTokens)} en caché)` : null,
    `· Salida ${formatTokenTotal(tokens.outputTokens)}`,
    tokens.reasoningTokens ? `(${formatTokenTotal(tokens.reasoningTokens)} de razonamiento)` : null,
  ]
    .filter(Boolean)
    .join(" ");

export const USAGE_KIND_LABELS = {
  TURN: "Turno",
  SKILL: "Habilidad",
  TITLE: "Título",
  TRANSCRIPTION: "Dictado",
} as const;

// "45 s", "2,5 min": el dictado se cobra por audio, no por tokens.
export const formatAudioDuration = (seconds: number) =>
  seconds < 60 ? `${integer.format(seconds)} s` : `${decimal.format(Math.round(seconds / 6) / 10)} min`;
