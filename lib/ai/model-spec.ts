import {
  AGENT_MODE_IDS,
  AGENT_REASONING_LEVELS,
  DEFAULT_AGENT_MODE,
  DEFAULT_MODE_SPECS,
  TITLE_MODEL_SPEC,
  isAgentMode,
  type AgentMode,
  type AgentReasoning,
} from "@/lib/ai/modes";

// Qué modelo atiende cada llamada. Puro y sin SDK: el entorno se recibe como
// parámetro para que el check pueda probar los overrides sin tocar process.env.
export const AI_PROVIDERS = ["openai", "gateway"] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];

export type AiEnv = Readonly<Record<string, string | undefined>>;

export type ModelSpec = {
  provider: AiProvider;
  modelId: string;
  reasoning: AgentReasoning;
  temperature?: number;
};

export type AgentModelSpec = ModelSpec & { mode: AgentMode };

// Una variable vacía (como las del .env.template) cuenta como no configurada.
export const readAiEnv = (env: AiEnv, key: string) => {
  const value = env[key]?.trim();
  return value ? value : undefined;
};

const readChoice = <T extends string>(
  env: AiEnv,
  key: string,
  allowed: readonly T[]
): T | undefined => {
  const raw = readAiEnv(env, key);
  if (raw === undefined) return undefined;
  const value = raw.toLowerCase();
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${key} inválido: "${raw}". Valores posibles: ${allowed.join(", ")}`);
  }
  return value as T;
};

export const resolveAiProvider = (env: AiEnv = process.env): AiProvider =>
  readChoice(env, "AI_PROVIDER", AI_PROVIDERS) ?? "openai";

// El gateway identifica los modelos como "proveedor/modelo". Sin prefijo, se
// asume OpenAI para que cambiar AI_PROVIDER no obligue a renombrar modelos.
const toProviderModelId = (provider: AiProvider, modelId: string, key: string) => {
  if (provider === "gateway") {
    return modelId.includes("/") ? modelId : `openai/${modelId}`;
  }
  if (modelId.includes("/")) {
    throw new Error(
      `${key} apunta a "${modelId}", que no es de OpenAI. Configurá AI_PROVIDER=gateway.`
    );
  }
  return modelId;
};

export const resolveModelSpec = (
  mode: AgentMode,
  env: AiEnv = process.env
): AgentModelSpec => {
  if (!isAgentMode(mode)) throw new Error(`Modo de IA desconocido: ${String(mode)}`);

  const suffix = mode.toUpperCase();
  const defaults = DEFAULT_MODE_SPECS[mode];
  const provider = resolveAiProvider(env);
  const modelKey = `AI_MODEL_${suffix}`;

  return {
    mode,
    provider,
    modelId: toProviderModelId(
      provider,
      readAiEnv(env, modelKey) ?? defaults.modelId,
      modelKey
    ),
    reasoning:
      readChoice(env, `AI_REASONING_${suffix}`, AGENT_REASONING_LEVELS) ??
      defaults.reasoning,
  };
};

export const resolveTitleModelSpec = (env: AiEnv = process.env): ModelSpec => {
  const provider = resolveAiProvider(env);
  return {
    provider,
    modelId: toProviderModelId(provider, TITLE_MODEL_SPEC.modelId, "TITLE_MODEL_SPEC"),
    reasoning: TITLE_MODEL_SPEC.reasoning,
  };
};

export const resolveDefaultMode = (env: AiEnv = process.env): AgentMode =>
  readChoice(env, "AI_DEFAULT_MODE", AGENT_MODE_IDS) ?? DEFAULT_AGENT_MODE;
