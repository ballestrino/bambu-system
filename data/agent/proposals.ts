import "server-only";

import { proposalSelect, serializeProposal } from "@/lib/agent/proposals";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Las propuestas son de quien conversa. El estado es el vivo: una pendiente
// vencida se ve vencida sin escribir nada.
export const getConversationProposals = async (conversationId: string) => {
  const session = await requireAdminSession();
  const rows = await db.agentProposal.findMany({
    where: { conversationId, actorId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: proposalSelect,
  });
  const now = new Date();
  return rows.map((row) => serializeProposal(row, now));
};

export const getAgentProposal = async (proposalId: string) => {
  const session = await requireAdminSession();
  const row = await db.agentProposal.findFirst({
    where: { id: proposalId, actorId: session.user.id },
    select: proposalSelect,
  });
  return row ? serializeProposal(row) : null;
};

// Cuántas propuestas siguen esperando en cada conversación (la etiqueta
// "N pendientes" del historial): PENDING y sin vencer, como las cuenta la
// barra de pendientes de la conversación.
export const getPendingProposalCounts = async (conversationIds: string[], now = new Date()) => {
  await requireAdminSession();
  if (!conversationIds.length) return {};
  const groups = await db.agentProposal.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: conversationIds }, status: "PENDING", expiresAt: { gt: now } },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((group) => [group.conversationId, group._count._all])) as Record<string, number>;
};
