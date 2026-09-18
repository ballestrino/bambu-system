import "server-only";

import { Prisma } from "@prisma/client";

import { toDbAgentMode } from "@/lib/agent/conversation-mode";
import {
  getMessageText,
  rowToAgentMessage,
  toDbMessageRole,
  type AgentUIMessage,
} from "@/lib/agent/messages";
import type { AgentSkillId } from "@/lib/agent/skills/types";
import type { AgentMode } from "@/lib/ai/modes";
import { db } from "@/lib/db";

// Mensajes que ve el modelo en cada turno. Lo anterior queda guardado pero no
// se manda: mantiene acotados el costo y el tiempo por turno.
export const HISTORY_LIMIT = 24;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const toJson = (value: unknown) => value as Prisma.InputJsonValue;

// Crea la conversación la primera vez (el id viene del cliente) y la toma solo
// si es del usuario: el updateMany con userId es el chequeo de pertenencia y
// además guarda el modo elegido. null = no existe para este usuario.
export const claimAgentConversation = async (input: {
  id: string;
  actorId: string;
  mode: AgentMode;
  title: string;
  budgetId: string | null;
  contextKind: string | null;
}) => {
  const existing = await db.agentConversation.findUnique({
    where: { id: input.id },
    select: { userId: true },
  });
  if (existing && existing.userId !== input.actorId) return null;

  let created = false;
  if (!existing) {
    try {
      await db.agentConversation.create({
        data: {
          id: input.id,
          userId: input.actorId,
          title: input.title,
          budgetId: input.budgetId,
          contextKind: input.contextKind,
          mode: toDbAgentMode(input.mode),
        },
      });
      created = true;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  const claimed = await db.agentConversation.updateMany({
    where: { id: input.id, userId: input.actorId },
    data: { mode: toDbAgentMode(input.mode), lastMessageAt: new Date() },
  });
  return claimed.count ? { created } : null;
};

// De qué conversación es un id de mensaje, si ya existe. Se mira antes de
// tocar la conversación: un pedido rechazado no puede dejar rastros.
export const getMessageConversationId = async (messageId: string) =>
  (await db.agentMessage.findUnique({ where: { id: messageId }, select: { conversationId: true } }))
    ?.conversationId ?? null;

// Idempotente: reenviar el mismo mensaje (reintento o regenerar) no lo
// duplica. null = el id ya es de otra conversación.
export const saveUserMessage = async (input: {
  conversationId: string;
  message: AgentUIMessage;
  skill: AgentSkillId;
}) => {
  const select = { conversationId: true, createdAt: true } as const;
  const existing = await db.agentMessage.findUnique({ where: { id: input.message.id }, select });
  if (existing) return existing.conversationId === input.conversationId ? existing : null;

  try {
    return await db.agentMessage.create({
      data: {
        id: input.message.id,
        conversationId: input.conversationId,
        role: "USER",
        parts: toJson(input.message.parts),
        text: getMessageText(input.message),
        metadata: input.message.metadata ? toJson(input.message.metadata) : Prisma.JsonNull,
        skill: input.skill,
      },
      select,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return null;
  }
};

// Al reintentar o regenerar, lo que vino después del mensaje del usuario ya
// no vale: se borra antes de responder de nuevo.
export const discardMessagesAfter = (conversationId: string, createdAt: Date) =>
  db.agentMessage.deleteMany({ where: { conversationId, createdAt: { gt: createdAt } } });

export const loadConversationMessages = async (conversationId: string) => {
  const rows = await db.agentMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { id: true, role: true, parts: true, metadata: true },
  });
  return rows.reverse().map(rowToAgentMessage);
};

export const saveAssistantMessage = async (input: {
  conversationId: string;
  message: AgentUIMessage;
  skill: AgentSkillId;
}) => {
  if (!input.message.parts.length) return;
  await db.agentMessage.create({
    data: {
      id: input.message.id,
      conversationId: input.conversationId,
      role: toDbMessageRole(input.message.role),
      parts: toJson(input.message.parts),
      text: getMessageText(input.message),
      metadata: input.message.metadata ? toJson(input.message.metadata) : Prisma.JsonNull,
      skill: input.skill,
    },
  });
  await db.agentConversation.update({
    where: { id: input.conversationId },
    data: { lastMessageAt: new Date() },
  });
};
