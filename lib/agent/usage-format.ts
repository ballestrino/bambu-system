import type { TurnUsageSummary } from "@/lib/agent/usage-collector";
import { AGENT_MODES, type AgentMode } from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";

// Cómo se muestran el modelo, los tokens y el costo en el Sheet. Puro: lo
// usan la línea de uso, el badge, los diálogos y el check.

// "gpt-5.6-terra" → "Terra". Con el gateway llega "openai/gpt-5.6-terra".
// Otro modelo se muestra con su id, sin el proveedor.
export const formatModelLabel = (modelId: string | null | undefined) => {
  if (!modelId) return "Modelo desconocido";
  const bare = modelId.split("/").pop() || modelId;
  const family = bare.match(/^gpt-5\.6-([a-z]+)$/)?.[1];
  return family ? `${family[0].toUpperCase()}${family.slice(1)}` : bare;
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

// "Terra · Medio · 3,2k tokens · US$ 0,03"
export const formatUsageLine = (usage: TurnUsageSummary, mode?: AgentMode) =>
  [
    formatModelLabel(usage.modelId),
    mode ? AGENT_MODES[mode].label : null,
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
