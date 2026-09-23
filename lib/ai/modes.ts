// Modos de calidad del agente. Módulo puro: lo usan la UI, la ruta y los
// checks, así que no importa el SDK.
export const AGENT_MODE_IDS = ["medio", "alto"] as const;

export type AgentMode = (typeof AGENT_MODE_IDS)[number];

// Mismos valores que la opción `reasoning` del AI SDK. Que el SDK los acepte
// no garantiza que el modelo los soporte: gpt-5.6 no acepta "minimal", y con
// gpt-6 @ai-sdk/openai solo manda low, medium, high y xhigh (descarta "none"
// y "minimal" con un aviso y el modelo usa su default).
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

// Cómo se nombra en "Costos de IA": "Luna 6 Extra alto".
export const REASONING_LABELS: Record<AgentReasoning, string> = {
  "provider-default": "razonamiento por defecto",
  none: "sin razonamiento",
  minimal: "Mínimo",
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  xhigh: "Extra alto",
};

export type ModeDefaults = {
  modelId: string;
  reasoning: AgentReasoning;
};

export const AGENT_MODES: Record<AgentMode, { label: string; description: string }> = {
  medio: {
    label: "Medio",
    description: "Económico y razona a fondo. Alcanza para el día a día.",
  },
  alto: {
    label: "Alto",
    description: "La mejor calidad para análisis y presupuestos complejos.",
  },
};

// Luna 6 con xhigh razona mejor que gpt-5.6-terra con high y cuesta menos;
// Sol 6 también es más barato que Terra.
export const DEFAULT_MODE_SPECS: Record<AgentMode, ModeDefaults> = {
  medio: { modelId: "gpt-6-luna", reasoning: "xhigh" },
  alto: { modelId: "gpt-6-sol", reasoning: "medium" },
};

export const DEFAULT_AGENT_MODE: AgentMode = "medio";

// Modos que ya no se eligen pero siguen en el enum de la base: los nombran
// conversaciones, mensajes y consumos viejos. Bajo (gpt-5.6-luna con xhigh)
// se retiró el 2026-09-23, cuando Medio pasó a Luna 6.
export const RETIRED_AGENT_MODES = {
  bajo: { label: "Bajo", replacedBy: "medio" },
} as const satisfies Record<string, { label: string; replacedBy: AgentMode }>;

// El modo con que se registró un mensaje o un consumo.
export type RecordedAgentMode = AgentMode | keyof typeof RETIRED_AGENT_MODES;

// El título de la conversación es una tarea chica: Luna 6 con razonamiento
// medio alcanza. Los turnos y los correos van con el modo (Medio es xhigh).
// Corre con after(), así que no demora la respuesta.
export const TITLE_MODEL_SPEC: ModeDefaults = {
  modelId: "gpt-6-luna",
  reasoning: "medium",
};

export const isAgentMode = (value: unknown): value is AgentMode =>
  typeof value === "string" && (AGENT_MODE_IDS as readonly string[]).includes(value);

export const formatAgentModeLabel = (mode: RecordedAgentMode) =>
  isAgentMode(mode) ? AGENT_MODES[mode].label : RETIRED_AGENT_MODES[mode]?.label;
