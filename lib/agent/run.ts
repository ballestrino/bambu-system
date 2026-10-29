import "server-only";

import {
  convertToModelMessages,
  isStepCount,
  streamText,
  toUIMessageStream,
  type ModelMessage,
  type UIMessageStreamWriter,
} from "ai";

import { CONTINUE_PROMPTS, getContinueReason, MAX_AUTO_CONTINUES } from "@/lib/agent/auto-continue";
import type { ResolvedBudgetContext } from "@/lib/agent/context";
import { toAgentErrorMessage } from "@/lib/agent/errors";
import type { Grounding } from "@/lib/agent/grounding";
import type { AgentMessageMetadata, AgentUIMessage } from "@/lib/agent/messages";
import { inlineHistoryImages } from "@/lib/agent/model-attachments";
import { prepareHistoryForModel } from "@/lib/agent/model-history";
import { getAgentSkill, resolveSkillToolNames, type AgentSkillId } from "@/lib/agent/skills";
import { createAgentTools } from "@/lib/agent/tools";
import type { AgentUsageCollector } from "@/lib/agent/usage-collector";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import type { AgentMode } from "@/lib/ai/modes";
import { resolveModelSpec } from "@/lib/ai/model-spec";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";

// Pasos del modelo por tramo (llamadas a tools incluidas). Responder un
// pedido de presupuesto sin uno guardado usa 6 (buscar el oficial, buscar uno
// igual, calcular, redactar, proponer y contestar); revisar la casilla y
// responder varios correos usa más. Si un tramo llega al tope, el turno sigue
// solo (lib/agent/auto-continue.ts), hasta MAX_AUTO_CONTINUES veces.
const MAX_STEPS = 12;

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
  startMetadata: AgentMessageMetadata;
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
  // Las imágenes recientes van con sus bytes: el modelo no puede leer la ruta
  // que las sirve. A Claude no se le reenvía el razonamiento de turnos
  // anteriores (ver lib/agent/model-history.ts).
  const history = await convertToModelMessages(
    await inlineHistoryImages(prepareHistoryForModel(input.messages, spec.modelId), input.actorId),
    { tools, ignoreIncompleteToolCalls: true }
  );

  const streamSegment = (messages: ModelMessage[]) =>
    streamText({
      ...settings,
      instructions: input.instructions,
      messages,
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
          reasoning: spec.reasoning,
          usage: normalizeUsage(step.usage),
          gatewayCostUsd: readGatewayCost(step.providerMetadata),
        }),
    });

  // Los tramos van uno detrás del otro en el mismo mensaje: cada uno se copia
  // entero al stream antes de arrancar el siguiente, así no se mezclan. El
  // aviso para seguir solo lo ve el modelo. Devuelve cuántas veces siguió y
  // si el último tramo terminó bien (sin error ni corte).
  const execute = async (writer: UIMessageStreamWriter<AgentUIMessage>) => {
    let messages = history;
    let autoContinues = 0;
    for (;;) {
      const result = streamSegment(messages);
      const reader = toUIMessageStream<typeof tools, AgentUIMessage>({
        stream: result.stream,
        tools,
        sendStart: autoContinues === 0,
        sendFinish: false,
        messageMetadata: ({ part }) => (part.type === "start" ? input.startMetadata : undefined),
        onError: toAgentErrorMessage,
      }).getReader();
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        writer.write(chunk.value);
      }

      let steps;
      try {
        steps = await result.steps;
      } catch {
        return { autoContinues, completed: false };
      }
      if (input.abortSignal?.aborted) return { autoContinues, completed: false };
      const reason = getContinueReason(steps, MAX_STEPS);
      if (!reason || autoContinues >= MAX_AUTO_CONTINUES) return { autoContinues, completed: true };
      autoContinues += 1;
      messages = [
        ...messages,
        ...(await result.responseMessages),
        { role: "user", content: CONTINUE_PROMPTS[reason] },
      ];
    }
  };

  return { tools, execute };
};
