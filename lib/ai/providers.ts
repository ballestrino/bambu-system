import { createAnthropic, type AnthropicProvider } from "@ai-sdk/anthropic";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { createGateway } from "ai";

import { hasGatewayCredentials, type ModelSpec } from "@/lib/ai/model-spec";

export { hasGatewayCredentials };

// Factories perezosas, como lib/mail-agent/openai-client.ts: importar este
// módulo no crea proveedores ni lee claves, así el build y las rutas que no
// usan IA no dependen de que el entorno esté configurado.
let openAIProvider: OpenAIProvider | undefined;
let anthropicProvider: AnthropicProvider | undefined;
let gatewayProvider: ReturnType<typeof createGateway> | undefined;

export const getOpenAIProvider = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Falta configurar OPENAI_API_KEY");
  openAIProvider ??= createOpenAI({ apiKey });
  return openAIProvider;
};

export const getAnthropicProvider = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Falta configurar ANTHROPIC_API_KEY");
  anthropicProvider ??= createAnthropic({ apiKey });
  return anthropicProvider;
};

export const getGatewayProvider = () => {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!hasGatewayCredentials()) throw new Error("Falta configurar AI_GATEWAY_API_KEY");
  gatewayProvider ??= createGateway(apiKey ? { apiKey } : {});
  return gatewayProvider;
};

// openai(id) ya usa la Responses API; responses(id) lo deja explícito. Claude
// va por la Messages API de Anthropic.
export const resolveLanguageModel = (spec: ModelSpec) => {
  if (spec.provider === "gateway") return getGatewayProvider()(spec.modelId);
  if (spec.provider === "anthropic") return getAnthropicProvider().messages(spec.modelId);
  return getOpenAIProvider().responses(spec.modelId);
};
