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
// AI_PROVIDER=openai (el default) es "directo": cada modelo va a su proveedor,
// OpenAI o Anthropic, con su clave. Con gateway, todo va por Vercel AI Gateway.
export const AI_PROVIDERS = ["openai", "gateway"] as const;

export type AiProviderSetting = (typeof AI_PROVIDERS)[number];

// A quién se le pide la llamada.
export type AiProvider = "openai" | "anthropic" | "gateway";

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

export const resolveAiProvider = (env: AiEnv = process.env): AiProviderSetting =>
  readChoice(env, "AI_PROVIDER", AI_PROVIDERS) ?? "openai";

// De quién es el modelo: los de Claude son de Anthropic y el resto de OpenAI.
export const getModelVendor = (modelId: string): "openai" | "anthropic" =>
  /^(anthropic\/)?claude-/.test(modelId) ? "anthropic" : "openai";

// El gateway identifica los modelos como "proveedor/modelo". Sin prefijo se
// agrega el del dueño del modelo, así cambiar AI_PROVIDER no obliga a
// renombrar modelos. Directo, un id con "/" pide el gateway.
const toProviderModel = (
  setting: AiProviderSetting,
  modelId: string,
  key: string
): Pick<ModelSpec, "provider" | "modelId"> => {
  if (setting === "gateway") {
    return {
      provider: "gateway",
      modelId: modelId.includes("/") ? modelId : `${getModelVendor(modelId)}/${modelId}`,
    };
  }
  if (modelId.includes("/")) {
    throw new Error(`${key} apunta a "${modelId}", que necesita AI_PROVIDER=gateway.`);
  }
  return { provider: getModelVendor(modelId), modelId };
};

export const resolveModelSpec = (
  mode: AgentMode,
  env: AiEnv = process.env
): AgentModelSpec => {
  if (!isAgentMode(mode)) throw new Error(`Modo de IA desconocido: ${String(mode)}`);

  const suffix = mode.toUpperCase();
  const defaults = DEFAULT_MODE_SPECS[mode];
  const modelKey = `AI_MODEL_${suffix}`;

  return {
    mode,
    ...toProviderModel(
      resolveAiProvider(env),
      readAiEnv(env, modelKey) ?? defaults.modelId,
      modelKey
    ),
    reasoning:
      readChoice(env, `AI_REASONING_${suffix}`, AGENT_REASONING_LEVELS) ??
      defaults.reasoning,
  };
};

export const resolveTitleModelSpec = (env: AiEnv = process.env): ModelSpec => ({
  ...toProviderModel(resolveAiProvider(env), TITLE_MODEL_SPEC.modelId, "TITLE_MODEL_SPEC"),
  reasoning: TITLE_MODEL_SPEC.reasoning,
});

// Sin clave, el SDK autentica el gateway con el token OIDC del proyecto de
// Vercel: existe en los deploys y localmente después de `vercel env pull`. El
// local vence a las 12 horas: vencido, pasa este chequeo y falla la llamada.
export const hasGatewayCredentials = (env: AiEnv = process.env) =>
  Boolean(readAiEnv(env, "AI_GATEWAY_API_KEY") || env.VERCEL || env.VERCEL_OIDC_TOKEN);

export const PROVIDER_KEY_NAMES = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gateway: "AI_GATEWAY_API_KEY",
} as const satisfies Record<AiProvider, string>;

// Si la llamada tiene con qué autenticarse. Un modo sin clave se muestra en el
// selector, deshabilitado y con la variable que falta.
export const hasProviderCredentials = (provider: AiProvider, env: AiEnv = process.env) =>
  provider === "gateway"
    ? hasGatewayCredentials(env)
    : Boolean(readAiEnv(env, PROVIDER_KEY_NAMES[provider]));

// AI_DEFAULT_MODE manda. Sin él, Haiku 5.5 Alto; si Anthropic no tiene clave
// todavía, Bajo (Luna 6), para que una conversación nueva no falle.
export const resolveDefaultMode = (env: AiEnv = process.env): AgentMode => {
  const configured = readChoice(env, "AI_DEFAULT_MODE", AGENT_MODE_IDS);
  if (configured) return configured;
  const spec = resolveModelSpec(DEFAULT_AGENT_MODE, env);
  return hasProviderCredentials(spec.provider, env) ? DEFAULT_AGENT_MODE : "bajo";
};
