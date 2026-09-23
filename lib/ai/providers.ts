import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { createGateway } from "ai";

import type { AiEnv, ModelSpec } from "@/lib/ai/model-spec";

// Factories perezosas, como lib/mail-agent/openai-client.ts: importar este
// módulo no crea proveedores ni lee claves, así el build y las rutas que no
// usan IA no dependen de que el entorno esté configurado.
let openAIProvider: OpenAIProvider | undefined;
let gatewayProvider: ReturnType<typeof createGateway> | undefined;

export const getOpenAIProvider = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Falta configurar OPENAI_API_KEY");
  openAIProvider ??= createOpenAI({ apiKey });
  return openAIProvider;
};

// Sin clave, el SDK autentica el gateway con el token OIDC del proyecto de
// Vercel: existe en los deploys y localmente después de `vercel env pull`. El
// local vence a las 12 horas: vencido, pasa este chequeo y falla la llamada.
export const hasGatewayCredentials = (env: AiEnv = process.env) =>
  Boolean(env.AI_GATEWAY_API_KEY?.trim() || env.VERCEL || env.VERCEL_OIDC_TOKEN);

export const getGatewayProvider = () => {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!hasGatewayCredentials()) throw new Error("Falta configurar AI_GATEWAY_API_KEY");
  gatewayProvider ??= createGateway(apiKey ? { apiKey } : {});
  return gatewayProvider;
};

// openai(id) ya usa la Responses API; responses(id) lo deja explícito.
export const resolveLanguageModel = (spec: ModelSpec) =>
  spec.provider === "gateway"
    ? getGatewayProvider()(spec.modelId)
    : getOpenAIProvider().responses(spec.modelId);
