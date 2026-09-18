// Modos de calidad del agente. Módulo puro: lo usan la UI, la ruta y los
// checks, así que no importa el SDK.
export const AGENT_MODE_IDS = ["bajo", "medio", "alto"] as const;

export type AgentMode = (typeof AGENT_MODE_IDS)[number];

// Mismos valores que la opción `reasoning` del AI SDK. Que el SDK los acepte
// no garantiza que el modelo los soporte: la familia gpt-5.6 no acepta
// "minimal".
export const AGENT_REASONING_LEVELS = [
  "provider-default",
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export type AgentReasoning = (typeof AGENT_REASONING_LEVELS)[number];

export type ModeDefaults = {
  modelId: string;
  reasoning: AgentReasoning;
};

export const AGENT_MODES: Record<AgentMode, { label: string; description: string }> = {
  bajo: {
    label: "Bajo",
    description: "El más económico. Razona a fondo, pero puede tardar más.",
  },
  medio: {
    label: "Medio",
    description: "Equilibrio entre calidad, velocidad y costo.",
  },
  alto: {
    label: "Alto",
    description: "La mejor calidad para análisis y presupuestos complejos.",
  },
};

export const DEFAULT_MODE_SPECS: Record<AgentMode, ModeDefaults> = {
  bajo: { modelId: "gpt-5.6-luna", reasoning: "xhigh" },
  medio: { modelId: "gpt-5.6-terra", reasoning: "high" },
  alto: { modelId: "gpt-5.6-sol", reasoning: "medium" },
};

export const DEFAULT_AGENT_MODE: AgentMode = "medio";

// El título de la conversación es una llamada corta y barata. "none" en vez
// de "minimal", que Luna rechaza.
export const TITLE_MODEL_SPEC: ModeDefaults = {
  modelId: "gpt-5.6-luna",
  reasoning: "none",
};

export const isAgentMode = (value: unknown): value is AgentMode =>
  typeof value === "string" && (AGENT_MODE_IDS as readonly string[]).includes(value);
