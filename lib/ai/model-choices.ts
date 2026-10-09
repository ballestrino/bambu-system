import { RECOMMENDED_AGENT_MODE, type AgentMode } from "@/lib/ai/modes";

// El selector del composer: primero el modelo y después el esfuerzo, entre los
// que ofrece ese modelo. Cada par modelo y esfuerzo es un modo. Puro.
export type ModelVendor = "anthropic" | "openai";

export type AgentModelChoice = {
  id: string;
  vendor: ModelVendor;
  label: string;
  description: string;
  // Del más barato al más caro; el primero es el que se elige al cambiar de
  // modelo.
  modes: readonly AgentMode[];
};

export const AGENT_MODEL_CHOICES: readonly AgentModelChoice[] = [
  {
    id: "haiku-5.5",
    vendor: "anthropic",
    label: "Haiku 5.5",
    description: "Rápido y económico. El recomendado para el día a día.",
    modes: ["haiku_high", "haiku_xhigh"],
  },
  {
    id: "sonnet-5.5",
    vendor: "anthropic",
    label: "Sonnet 5.5",
    description: "Más criterio para correos y presupuestos complejos.",
    modes: ["sonnet_high"],
  },
  {
    id: "opus-5.5",
    vendor: "anthropic",
    label: "Opus 5.5",
    description: "El más capaz de Claude, para análisis exigentes.",
    modes: ["opus_medium"],
  },
  {
    id: "luna-6",
    vendor: "openai",
    label: "Luna 6",
    description: "Económico y razona a fondo.",
    modes: ["bajo"],
  },
  {
    id: "sol-6.1",
    vendor: "openai",
    label: "Sol 6.1",
    description: "Para tareas más exigentes.",
    modes: ["medio", "alto"],
  },
];

export const MODEL_VENDOR_LABELS: Record<ModelVendor, string> = {
  anthropic: "Claude (Anthropic)",
  openai: "ChatGPT (OpenAI)",
};

export const findModelChoice = (mode: AgentMode) =>
  AGENT_MODEL_CHOICES.find((choice) => choice.modes.includes(mode)) ?? AGENT_MODEL_CHOICES[0];

export const isRecommendedMode = (mode: AgentMode) => mode === RECOMMENDED_AGENT_MODE;

// Al elegir un modelo: el esfuerzo recomendado si lo tiene, si no el primero.
export const defaultModeForChoice = (choice: AgentModelChoice) =>
  choice.modes.find(isRecommendedMode) ?? choice.modes[0];
