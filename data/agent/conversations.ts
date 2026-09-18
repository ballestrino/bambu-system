import "server-only";

import { fromDbAgentMode } from "@/lib/agent/conversation-mode";
import { rowToAgentMessage } from "@/lib/agent/messages";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

const conversationSelect = {
  id: true,
  title: true,
  mode: true,
  budgetId: true,
  contextKind: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ConversationRow = {
  id: string;
  title: string;
  mode: Parameters<typeof fromDbAgentMode>[0];
  budgetId: string | null;
  contextKind: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const serializeConversation = (row: ConversationRow) => ({
  ...row,
  mode: fromDbAgentMode(row.mode),
  lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type AgentConversationDto = ReturnType<typeof serializeConversation>;

// Las conversaciones son de cada usuario: las del presupuesto abierto, o las
// que no tienen presupuesto (la pantalla de crear).
export const getAgentConversations = async ({
  budgetId,
  query,
}: {
  budgetId?: string | null;
  query?: string;
}) => {
  const session = await requireAdminSession();
  const rows = await db.agentConversation.findMany({
    where: {
      userId: session.user.id,
      budgetId: budgetId ?? null,
      title: query ? { contains: query, mode: "insensitive" } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: conversationSelect,
  });
  return rows.map(serializeConversation);
};

// La conversación completa para reabrirla: todos sus mensajes con sus partes.
export const getAgentConversation = async (conversationId: string) => {
  const session = await requireAdminSession();
  const conversation = await db.agentConversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    select: conversationSelect,
  });
  if (!conversation) return null;

  const messages = await db.agentMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, parts: true, metadata: true },
  });
  return {
    conversation: serializeConversation(conversation),
    messages: messages.map(rowToAgentMessage),
  };
};
