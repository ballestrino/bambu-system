import "server-only";

import { getApprovedAgentKnowledge } from "@/data/agent/knowledge";
import { getAttachmentIds } from "@/lib/agent/attachment-rules";
import { checkMessageAttachments, linkMessageAttachments } from "@/lib/agent/attachment-store";
import { resolveBudgetContext } from "@/lib/agent/context";
import {
  claimAgentConversation,
  discardMessagesAfter,
  getMessageConversationId,
  loadConversationMessages,
  saveAssistantMessage,
  saveUserMessage,
} from "@/lib/agent/conversation-store";
import {
  fallbackConversationTitle,
  needsModelTitle,
  titleSourceText,
} from "@/lib/agent/conversation-title-rules";
import { addGroundedAmounts, collectGroundingFromMessages } from "@/lib/agent/grounding";
import { getMessageText, type AgentUIMessage } from "@/lib/agent/messages";
import { formatToday } from "@/lib/agent/month";
import { getConfirmedAmounts, withLiveProposals } from "@/lib/agent/proposal-context";
import {
  expireDiscardedProposals,
  listConversationProposals,
} from "@/lib/agent/proposal-store";
import { serializeProposal } from "@/lib/agent/proposals";
import { getAgentSkill, type AgentSkillId } from "@/lib/agent/skills";
import { buildAgentInstructions } from "@/lib/agent/system-prompt";
import { summarizeUsage, type UsageEntry } from "@/lib/agent/usage-collector";
import { persistUsageEntries } from "@/lib/agent/usage-store";
import type { AgentMode } from "@/lib/ai/modes";
import type { AgentChatRequest } from "@/schemas/agent";

export type AgentActor = { id: string; name: string | null };

// Todo lo que pasa antes de llamar al modelo: la conversación, el mensaje del
// usuario, el historial guardado, el contexto del presupuesto, la evidencia
// de precios y las instrucciones.
export const prepareAgentTurn = async (actor: AgentActor, request: AgentChatRequest) => {
  const userMessage: AgentUIMessage = {
    id: request.message.id,
    role: "user",
    parts: request.message.parts,
    metadata: { mode: request.mode, skill: request.skill, createdAt: new Date().toISOString() },
  };
  const userText = getMessageText(userMessage);
  const attachmentIds = getAttachmentIds(userMessage.parts);
  const messageOwner = await getMessageConversationId(userMessage.id);
  if (messageOwner && messageOwner !== request.id) {
    return { ok: false, error: "El mensaje no pertenece a esta conversación", status: 409 } as const;
  }
  const attachmentError = await checkMessageAttachments({
    userId: actor.id,
    messageId: userMessage.id,
    ids: attachmentIds,
  });
  if (attachmentError) return { ok: false, error: attachmentError, status: 409 } as const;
  const budgetContext = await resolveBudgetContext(request.context);

  const conversation = await claimAgentConversation({
    id: request.id,
    actorId: actor.id,
    mode: request.mode,
    title: fallbackConversationTitle(titleSourceText(userMessage)),
    budgetId: budgetContext.budgetId,
    contextKind: budgetContext.kind,
  });
  if (!conversation) return { ok: false, error: "Conversación no encontrada", status: 404 } as const;

  const saved = await saveUserMessage({
    conversationId: request.id,
    message: userMessage,
    skill: request.skill,
  });
  if ("error" in saved) return { ok: false, error: saved.error, status: 409 } as const;
  await linkMessageAttachments({ userId: actor.id, messageId: userMessage.id, ids: attachmentIds });
  await discardMessagesAfter(request.id, saved.createdAt);
  await expireDiscardedProposals(request.id, saved.createdAt);

  const [history, knowledge, rows] = await Promise.all([
    loadConversationMessages(request.id),
    getApprovedAgentKnowledge(),
    listConversationProposals(request.id),
  ]);
  // El modelo ve el estado actual de cada propuesta, no el de cuando se hizo.
  const now = new Date();
  const proposals = rows.map((row) => serializeProposal(row, now));
  const messages = withLiveProposals(history, proposals);
  const grounding = collectGroundingFromMessages(messages);
  addGroundedAmounts(grounding, getConfirmedAmounts(proposals));
  addGroundedAmounts(grounding, budgetContext.amounts);

  return {
    ok: true as const,
    needsTitle: needsModelTitle(messages, conversation.title),
    conversationTitle: conversation.title,
    userText,
    messages,
    grounding,
    budgetContext,
    instructions: buildAgentInstructions({
      today: formatToday(),
      actorName: actor.name,
      skill: getAgentSkill(request.skill),
      budgetContextText: budgetContext.text,
      approvedKnowledge: knowledge,
      proposals,
    }),
  };
};

// Al terminar el stream, incluso si se cortó: el consumo se registra siempre
// (se pagó) y la respuesta se guarda con lo que alcanzó a llegar.
export const finishAgentTurn = async (input: {
  conversationId: string;
  responseMessage: AgentUIMessage;
  mode: AgentMode;
  skill: AgentSkillId;
  entries: UsageEntry[];
  stopped: boolean;
}) => {
  try {
    await persistUsageEntries({
      conversationId: input.conversationId,
      messageId: input.responseMessage.id,
      mode: input.mode,
      entries: input.entries,
    });
  } catch (error) {
    console.error("Agent usage persistence failed:", error);
  }
  // Un turno cortado no llega al finish que trae la línea de uso: se arma con
  // lo que alcanzó a correr. Si se detuvo, queda marcado: el paso cortado no
  // informa consumo (OpenAI lo manda al terminar la respuesta).
  const metadata = input.responseMessage.metadata;
  const message = {
    ...input.responseMessage,
    metadata: {
      ...metadata,
      ...(!metadata?.usage && input.entries.length ? { usage: summarizeUsage(input.entries) } : {}),
      ...(input.stopped ? { stopped: true } : {}),
    },
  };
  try {
    await saveAssistantMessage({
      conversationId: input.conversationId,
      message,
      skill: input.skill,
    });
  } catch (error) {
    console.error("Agent message persistence failed:", error);
  }
};
