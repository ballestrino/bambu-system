// Modos de calidad del agente. Módulo puro: lo usan la UI, la ruta y los
// checks, así que no importa el SDK.
export const AGENT_MODE_IDS = ["bajo", "medio", "alto"] as const;

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
  bajo: {
    label: "Bajo",
    description: "Económico y razona a fondo. Alcanza para el día a día.",
  },
  medio: {
    label: "Medio",
    description: "Sol 6.1 con razonamiento bajo para tareas más exigentes.",
  },
  alto: {
    label: "Alto",
    description: "La mejor calidad para análisis y presupuestos complejos.",
  },
};

// Bajo prioriza costo; Medio y Alto usan Sol 6.1 con distinto razonamiento.
export const DEFAULT_MODE_SPECS: Record<AgentMode, ModeDefaults> = {
  bajo: { modelId: "gpt-6-luna", reasoning: "xhigh" },
  medio: { modelId: "gpt-6.1-sol", reasoning: "low" },
  alto: { modelId: "gpt-6.1-sol", reasoning: "medium" },
};

export const DEFAULT_AGENT_MODE: AgentMode = "bajo";

// Todos los modos históricos vuelven a estar activos.
export type RecordedAgentMode = AgentMode;

// El título de la conversación es una tarea chica: Luna 6 con razonamiento
// medio alcanza. Los turnos y los correos van con el modo elegido.
// Corre con after(), así que no demora la respuesta.
export const TITLE_MODEL_SPEC: ModeDefaults = {
  modelId: "gpt-6-luna",
  reasoning: "medium",
};

export const isAgentMode = (value: unknown): value is AgentMode =>
  typeof value === "string" && (AGENT_MODE_IDS as readonly string[]).includes(value);

export const formatAgentModeLabel = (mode: RecordedAgentMode) =>
  AGENT_MODES[mode].label;
