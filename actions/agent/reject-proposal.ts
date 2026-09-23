"use server";

import { getAgentProposal } from "@/data/agent/proposals";
import { auditProposal, markProposalExpired } from "@/lib/agent/proposal-store";
import { describeRejectOutcome } from "@/lib/agent/proposals";
import { db } from "@/lib/db";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";
import { agentProposalIdSchema } from "@/schemas/agent-proposals";

// Rechazar solo mueve una pendiente sin vencer a REJECTED: no escribe nada
// más. Repetirlo devuelve el mismo resultado y una confirmada no se rechaza.
export const rejectAgentProposal = async (proposalId: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = agentProposalIdSchema.safeParse(proposalId);
    if (!parsed.success) return { error: "Propuesta inválida" };
    const id = parsed.data;
    const actorId = session.user.id;

    const now = new Date();
    const { count } = await db.agentProposal.updateMany({
      where: { id, actorId, status: "PENDING", expiresAt: { gt: now } },
      data: { status: "REJECTED", resolvedAt: now },
    });
    if (!count) await markProposalExpired(id, actorId, now);

    const proposal = await getAgentProposal(id);
    if (!proposal) return { error: "Propuesta no encontrada" };
    if (count) {
      await auditProposal({
        actorId,
        action: "proposal.reject",
        entityType: "AgentProposal",
        entityId: id,
        metadata: { kind: proposal.kind },
      });
    }
    return describeRejectOutcome(proposal);
  } catch (error) {
    console.error("Error rejecting agent proposal:", error);
    return {
      error: error instanceof AdminAuthorizationError ? error.message : "Error al rechazar la propuesta",
    };
  }
};
