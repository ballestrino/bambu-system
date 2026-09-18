import type { OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";

import type { ModelSpec } from "@/lib/ai/model-spec";
import { resolveLanguageModel } from "@/lib/ai/providers";
import { getAiSafetyIdentifier } from "@/lib/ai/safety-identifier";

// Settings comunes a toda llamada del agente, para esparcir en streamText o
// generateText. `reasoning` es la opción agnóstica del SDK: con otro proveedor
// del gateway se traduce a su equivalente. Las opciones de OpenAI se ignoran
// si el modelo es de otro proveedor.
export const buildAgentCallSettings = (
  spec: ModelSpec,
  { actorId }: { actorId: string }
) => ({
  model: resolveLanguageModel(spec),
  reasoning: spec.reasoning,
  ...(spec.temperature === undefined ? {} : { temperature: spec.temperature }),
  providerOptions: {
    openai: {
      store: false,
      safetyIdentifier: getAiSafetyIdentifier("agent", actorId),
      parallelToolCalls: false,
    } satisfies OpenAILanguageModelResponsesOptions,
  },
});
