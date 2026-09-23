import type { TurnUsageSummary } from "@/lib/agent/usage-collector";
import {
  REASONING_LABELS,
  formatAgentModeLabel,
  type AgentReasoning,
  type RecordedAgentMode,
} from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";

// Cómo se muestran el modelo, los tokens y el costo en el Sheet. Puro: lo
// usan la línea de uso, el badge, los diálogos y el check.

// "gpt-6-luna" → "Luna 6", "gpt-5.6-luna" → "Luna 5.6": el historial tiene
// las dos generaciones. Con el gateway llega "openai/gpt-6-luna". Otro modelo
// se muestra con su id, sin el proveedor.
export const formatModelLabel = (modelId: string | null | undefined) => {
  if (!modelId) return "Modelo desconocido";
  const bare = modelId.split("/").pop() || modelId;
  const [, version, family] = bare.match(/^gpt-(6|5\.6)-([a-z]+)$/) ?? [];
  return family ? `${family[0].toUpperCase()}${family.slice(1)} ${version}` : bare;
};

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

// "Luna 6 · Medio · 3,2k tokens · US$ 0,03"
export const formatUsageLine = (usage: TurnUsageSummary, mode?: RecordedAgentMode) =>
  [
    formatModelLabel(usage.modelId),
    mode ? formatAgentModeLabel(mode) : null,
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
} as const;
