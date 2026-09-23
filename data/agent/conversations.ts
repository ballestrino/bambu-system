import "server-only";

import { fromDbAgentMode } from "@/lib/agent/conversation-mode";
import { conversationListLimit } from "@/lib/agent/conversation-scope";
import { rowToAgentMessage } from "@/lib/agent/messages";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// El presupuesto va con nombre y slug: la página lista conversaciones de
// todos y linkea a cada uno.
const conversationSelect = {
  id: true,
  title: true,
  mode: true,
  budgetId: true,
  budget: { select: { id: true, name: true, slug: true } },
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
  budget: { id: string; name: string; slug: string } | null;
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

// Las conversaciones son de cada usuario: las del presupuesto abierto, las que
// no tienen presupuesto (la pantalla de crear) o, con all, todas (la página).
export const getAgentConversations = async ({
  budgetId,
  all,
  query,
}: {
  budgetId?: string | null;
  all?: boolean;
  query?: string;
}) => {
  const session = await requireAdminSession();
  const rows = await db.agentConversation.findMany({
    where: {
      userId: session.user.id,
      ...(all ? {} : { budgetId: budgetId ?? null }),
      title: query ? { contains: query, mode: "insensitive" } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    take: conversationListLimit(all),
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
