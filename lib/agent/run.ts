import "server-only";

import { convertToModelMessages, isStepCount, streamText } from "ai";

import type { ResolvedBudgetContext } from "@/lib/agent/context";
import type { Grounding } from "@/lib/agent/grounding";
import type { AgentUIMessage } from "@/lib/agent/messages";
import { getAgentSkill, resolveSkillToolNames, type AgentSkillId } from "@/lib/agent/skills";
import { createAgentTools } from "@/lib/agent/tools";
import type { AgentUsageCollector } from "@/lib/agent/usage-collector";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import type { AgentMode } from "@/lib/ai/modes";
import { resolveModelSpec } from "@/lib/ai/model-spec";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";

// Pasos del modelo por turno (llamadas a tools incluidas). Responder un
// pedido de presupuesto sin uno guardado usa 6 (buscar el oficial, buscar uno
// igual, calcular, redactar, proponer y contestar): 8 deja lugar a un
// reintento.
const MAX_STEPS = 8;

// Tope por paso. Incluye el razonamiento, que en Luna con xhigh puede ser
// largo: con 4000 un paso podía quedarse sin lugar para la respuesta.
const MAX_OUTPUT_TOKENS = 16_000;

export const runAgentTurn = async (input: {
  actorId: string;
  conversationId: string;
  mode: AgentMode;
  skill: AgentSkillId;
  instructions: string;
  messages: AgentUIMessage[];
  budgetContext: ResolvedBudgetContext;
  grounding: Grounding;
  usage: AgentUsageCollector;
  abortSignal?: AbortSignal;
}) => {
  const spec = resolveModelSpec(input.mode);
  const settings = buildAgentCallSettings(spec, { actorId: input.actorId });
  const tools = createAgentTools({
    actorId: input.actorId,
    conversationId: input.conversationId,
    mode: input.mode,
    budgetId: input.budgetContext.budgetId,
    formValues: input.budgetContext.formValues,
    grounding: input.grounding,
    usage: input.usage,
  });

  const result = streamText({
    ...settings,
    instructions: input.instructions,
    messages: await convertToModelMessages(input.messages, {
      tools,
      ignoreIncompleteToolCalls: true,
    }),
    tools,
    // Todas registradas (el historial puede traer tools de otra habilidad),
    // solo las de la habilidad disponibles para este turno.
    activeTools: resolveSkillToolNames(getAgentSkill(input.skill)),
    toolChoice: "auto",
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: input.abortSignal,
    onStepEnd: (step) =>
      input.usage.add({
        kind: "TURN",
        modelId: step.model.modelId,
        usage: normalizeUsage(step.usage),
        gatewayCostUsd: readGatewayCost(step.providerMetadata),
      }),
  });

  return { result, tools };
};
