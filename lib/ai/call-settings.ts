import type { AnthropicLanguageModelOptions } from "@ai-sdk/anthropic";
import type { OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";

import { getModelVendor, type ModelSpec } from "@/lib/ai/model-spec";
import type { AgentReasoning } from "@/lib/ai/modes";
import { resolveLanguageModel } from "@/lib/ai/providers";
import { getAiSafetyIdentifier } from "@/lib/ai/safety-identifier";

type AnthropicEffort = NonNullable<AnthropicLanguageModelOptions["effort"]>;

// Claude no apaga el razonamiento (Opus 5.5 y Sonnet 5.5 rechazan
// "disabled"): sin razonamiento es el esfuerzo más bajo.
const ANTHROPIC_EFFORT: Record<AgentReasoning, AnthropicEffort | undefined> = {
  "provider-default": undefined,
  none: "low",
  minimal: "low",
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "xhigh",
};

// Opus 5.5 y Sonnet 5.5 tienen safeguards que pueden cortar con "refusal":
// "default" reintenta en otro modelo dentro de la misma llamada. Haiku 5.5 no
// tiene fallback del lado del servidor.
const supportsServerFallback = (modelId: string) => /claude-(opus|sonnet)-5-5/.test(modelId);

const buildAnthropicOptions = (spec: ModelSpec, actorId: string) => {
  const effort = ANTHROPIC_EFFORT[spec.reasoning];
  return {
    // El razonamiento resumido se ve igual que el de OpenAI. Si el historial
    // cambió (ver lib/agent/model-history.ts), un bloque de pensamiento que ya
    // no corresponde se descarta en vez de dar 400.
    thinking: {
      type: "adaptive",
      display: "summarized",
      blockBinding: { prefixMismatchBehavior: "drop_block" },
    },
    ...(effort ? { effort } : {}),
    disableParallelToolUse: true,
    // OpenAI cachea solo; Claude necesita la marca. Con una sola arriba, cada
    // paso del turno lee de caché lo que mandó el anterior.
    cacheControl: { type: "ephemeral" },
    metadata: { userId: getAiSafetyIdentifier("agent", actorId) },
    ...(supportsServerFallback(spec.modelId) ? { fallbacks: "default" as const } : {}),
  } satisfies AnthropicLanguageModelOptions;
};

// Settings comunes a toda llamada del agente, para esparcir en streamText o
// generateText. `reasoning` es la opción agnóstica del SDK: con otro proveedor
// del gateway se traduce a su equivalente; con Claude manda el `effort` de
// las opciones de Anthropic. Las opciones de un proveedor se ignoran si el
// modelo es de otro.
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
    ...(getModelVendor(spec.modelId) === "anthropic"
      ? { anthropic: buildAnthropicOptions(spec, actorId) }
      : {}),
  },
});
