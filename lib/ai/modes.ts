// Modos del agente: cada uno es un modelo con un esfuerzo de razonamiento.
// Módulo puro: lo usan la UI, la ruta y los checks, así que no importa el SDK.
// Bajo, Medio y Alto son los modos de OpenAI de antes (los nombres quedan por
// el historial); los de Claude se nombran por modelo y esfuerzo.
export const AGENT_MODE_IDS = [
  "bajo",
  "medio",
  "alto",
  "haiku_high",
  "haiku_xhigh",
  "sonnet_high",
  "opus_medium",
] as const;

export type AgentMode = (typeof AGENT_MODE_IDS)[number];

// Mismos valores que la opción `reasoning` del AI SDK. Que el SDK los acepte
// no garantiza que el modelo los soporte: gpt-5.6 no acepta "minimal", y con
// gpt-6 @ai-sdk/openai solo manda low, medium, high y xhigh (descarta "none"
// y "minimal" con un aviso y el modelo usa su default). En Claude es el
// `effort` (ver lib/ai/call-settings.ts).
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

// Cómo se nombra en "Costos de IA" y en el selector: "Luna 6 Extra alto".
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

// Bajo es Luna 6 con xhigh, Medio y Alto son Sol 6.1 con low y medium. Haiku
// 5.5 con high es el recomendado y el modo por defecto.
export const DEFAULT_MODE_SPECS: Record<AgentMode, ModeDefaults> = {
  bajo: { modelId: "gpt-6-luna", reasoning: "xhigh" },
  medio: { modelId: "gpt-6.1-sol", reasoning: "low" },
  alto: { modelId: "gpt-6.1-sol", reasoning: "medium" },
  haiku_high: { modelId: "claude-haiku-5-5", reasoning: "high" },
  haiku_xhigh: { modelId: "claude-haiku-5-5", reasoning: "xhigh" },
  sonnet_high: { modelId: "claude-sonnet-5-5", reasoning: "high" },
  opus_medium: { modelId: "claude-opus-5-5", reasoning: "medium" },
};

// Los nombres de antes de elegir modelo y esfuerzo. Los mensajes y consumos
// viejos los muestran tal cual se registraron ("Luna 6 · Medio").
export const LEGACY_MODE_LABELS: Partial<Record<AgentMode, string>> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

export const DEFAULT_AGENT_MODE: AgentMode = "haiku_high";

export const RECOMMENDED_AGENT_MODE: AgentMode = "haiku_high";

// Todos los modos registrados siguen activos.
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

// "gpt-6-luna" → "Luna 6", "claude-haiku-5-5" → "Haiku 5.5". Con el gateway
// llega con el proveedor ("openai/…", "anthropic/…"). Otro modelo se muestra
// con su id, sin el proveedor.
export const formatModelLabel = (modelId: string | null | undefined) => {
  if (!modelId) return "Modelo desconocido";
  const bare = modelId.split("/").pop() || modelId;
  const [, gptVersion, gptFamily] = bare.match(/^gpt-(6\.1|6|5\.6)-([a-z]+)$/) ?? [];
  if (gptFamily) return `${capitalize(gptFamily)} ${gptVersion}`;
  const [, claudeFamily, major, minor] = bare.match(/^claude-([a-z]+)-(\d+)(?:-(\d))?$/) ?? [];
  if (claudeFamily) return `${capitalize(claudeFamily)} ${minor ? `${major}.${minor}` : major}`;
  return bare;
};

const capitalize = (value: string) => `${value[0].toUpperCase()}${value.slice(1)}`;

// "Haiku 5.5 Alto": el modelo y el esfuerzo del modo, con los defaults.
export const formatAgentModeLabel = (mode: RecordedAgentMode) => {
  const spec = DEFAULT_MODE_SPECS[mode];
  return `${formatModelLabel(spec.modelId)} ${REASONING_LABELS[spec.reasoning]}`;
};
