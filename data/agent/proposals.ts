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
