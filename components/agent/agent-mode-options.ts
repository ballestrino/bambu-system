import type { AgentSettings } from "@/components/agent/types";
import {
  AGENT_MODEL_CHOICES,
  isRecommendedMode,
  type AgentModelChoice,
} from "@/lib/ai/model-choices";
import { AGENT_MODE_IDS, DEFAULT_MODE_SPECS, type AgentMode } from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";

// Las opciones del selector de modelo y esfuerzo, con lo que resuelve el
// servidor (getAgentSettings) o, mientras carga, los defaults sin costo.
export type ModeOption = AgentSettings["modes"][number];

const toFallbackOption = (id: AgentMode): ModeOption => ({
  id,
  ...DEFAULT_MODE_SPECS[id],
  recommended: isRecommendedMode(id),
  missingKey: null,
  estimatedCostUsd: null,
});

export const FALLBACK_MODE_OPTIONS = AGENT_MODE_IDS.map(toFallbackOption);

export const findModeOption = (options: ModeOption[], mode: AgentMode) =>
  options.find((option) => option.id === mode) ?? toFallbackOption(mode);

export const choiceOptions = (choice: AgentModelChoice, options: ModeOption[]) =>
  choice.modes.map((mode) => findModeOption(options, mode));

export const formatEstimate = (costUsd: number | null) =>
  costUsd === null ? null : `≈ ${formatUsd(costUsd)}`;

// El costo de un modelo en su menú: el de su único esfuerzo o el rango
// ("≈ US$ 0,002–0,004" se escribe con los dos montos completos).
export const formatChoiceEstimate = (options: ModeOption[]) => {
  const costs = options.flatMap((option) => (option.estimatedCostUsd === null ? [] : [option.estimatedCostUsd]));
  if (!costs.length) return null;
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  return min === max ? formatEstimate(min) : `≈ ${formatUsd(min)} – ${formatUsd(max)}`;
};

// Un modelo se puede elegir si alguno de sus esfuerzos tiene clave.
export const choiceMissingKey = (options: ModeOption[]) =>
  options.every((option) => option.missingKey) ? options[0]?.missingKey ?? null : null;

export const choicesByVendor = () => ({
  anthropic: AGENT_MODEL_CHOICES.filter((choice) => choice.vendor === "anthropic"),
  openai: AGENT_MODEL_CHOICES.filter((choice) => choice.vendor === "openai"),
});
