import "server-only";

import { Prisma } from "@prisma/client";

import { recordAgentAudit } from "@/lib/agent/audit";
import { REVISABLE_PROPOSAL_STATUSES } from "@/lib/agent/budget-draft";
import {
  getProposalExpiry,
  proposalSelect,
  type AgentProposalKind,
  type ProposalSummary,
} from "@/lib/agent/proposals";
import { db } from "@/lib/db";

// Escrituras de AgentProposal fuera de confirmar y rechazar: la propuesta que
// guardan las tools, los vencimientos y su auditoría. Ningún presupuesto se
// escribe acá: eso pasa al confirmar, en actions/agent.
const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const toJson = (value: unknown) => value as Prisma.InputJsonValue;

// La auditoría no puede tirar una propuesta ya guardada.
export const auditProposal = (input: Parameters<typeof recordAgentAudit>[0]) =>
  recordAgentAudit(input).catch((error) => {
    console.error("Agent proposal audit failed:", error);
  });

// Queda PENDING hasta que quien conversa la confirme o la rechace. Si la misma
// llamada a la tool llega dos veces, devuelve la propuesta ya guardada.
export const saveAgentProposal = async (input: {
  conversationId: string;
  actorId: string;
  toolCallId: string;
  kind: AgentProposalKind;
  payload: unknown;
  summary: ProposalSummary;
}) => {
  try {
    const proposal = await db.agentProposal.create({
      data: {
        kind: input.kind,
        payload: toJson(input.payload),
        summary: toJson(input.summary),
        toolCallId: input.toolCallId,
        conversationId: input.conversationId,
        actorId: input.actorId,
        expiresAt: getProposalExpiry(new Date()),
      },
      select: proposalSelect,
    });
    await auditProposal({
      actorId: input.actorId,
      action: "proposal.create",
      entityType: "AgentProposal",
      entityId: proposal.id,
      metadata: { kind: input.kind, conversationId: input.conversationId },
    });
    return proposal;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return db.agentProposal.findUniqueOrThrow({
      where: {
        conversationId_toolCallId: {
          conversationId: input.conversationId,
          toolCallId: input.toolCallId,
        },
      },
      select: proposalSelect,
    });
  }
};

// Guardar desde el chat un presupuesto que armó el agente deja una propuesta
// de esa llamada a tool: nueva (un cálculo), o la existente con los valores
// editados si todavía no se ejecutó (una rechazada o vencida vuelve a
// pendiente). Una confirmada o en ejecución no cambia: confirmarla después
// devuelve su estado. La condición del update cierra la carrera con otro
// guardado o con confirmar desde la tarjeta.
export const reviseAgentProposal = async (input: {
  conversationId: string;
  actorId: string;
  toolCallId: string;
  kind: AgentProposalKind;
  payload: unknown;
  summary: ProposalSummary;
}) => {
  const existing = await db.agentProposal.findUnique({
    where: {
      conversationId_toolCallId: { conversationId: input.conversationId, toolCallId: input.toolCallId },
    },
    select: { id: true, kind: true, status: true, actorId: true },
  });
  if (!existing) return { ok: true as const, id: (await saveAgentProposal(input)).id };
  if (existing.actorId !== input.actorId || existing.kind !== input.kind) {
    return { ok: false as const, error: "Ese presupuesto no se puede guardar desde acá." };
  }

  const { count } = await db.agentProposal.updateMany({
    where: { id: existing.id, status: { in: [...REVISABLE_PROPOSAL_STATUSES] } },
    data: {
      payload: toJson(input.payload),
      summary: toJson(input.summary),
      status: "PENDING",
      error: null,
      resolvedAt: null,
      expiresAt: getProposalExpiry(new Date()),
    },
  });
  if (count) {
    await auditProposal({
      actorId: input.actorId,
      action: "proposal.revise",
      entityType: "AgentProposal",
      entityId: existing.id,
      metadata: { kind: input.kind, previousStatus: existing.status },
    });
  }
  return { ok: true as const, id: existing.id };
};

// Las últimas propuestas de la conversación: el bloque del prompt y el estado
// vivo del historial (24 mensajes). Alcanza con holgura para ese historial.
export const listConversationProposals = async (conversationId: string) => {
  const rows = await db.agentProposal.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: proposalSelect,
  });
  return rows.reverse();
};

// Una pendiente vencida queda registrada como EXPIRED cuando alguien intenta
// confirmarla o rechazarla: las lecturas ya la mostraban vencida.
export const markProposalExpired = async (id: string, actorId: string, now: Date) => {
  const where = { id, actorId, status: "PENDING" as const, expiresAt: { lte: now } };
  const expired = await db.agentProposal.findFirst({ where, select: { kind: true } });
  if (!expired) return;
  const { count } = await db.agentProposal.updateMany({
    where,
    data: { status: "EXPIRED", resolvedAt: now },
  });
  if (!count) return;
  await auditProposal({
    actorId,
    action: "proposal.expire",
    entityType: "AgentProposal",
    entityId: id,
    metadata: { kind: expired.kind, reason: "ttl" },
  });
};

export const DISCARDED_PROPOSAL_ERROR = "Se descartó la respuesta que la había propuesto.";

// Al reintentar o regenerar se borran las respuestas posteriores al mensaje:
// sus propuestas pendientes se quedan sin tarjeta y vencen.
export const expireDiscardedProposals = async (conversationId: string, after: Date) => {
  const discarded = await db.agentProposal.findMany({
    where: { conversationId, status: "PENDING", createdAt: { gt: after } },
    select: { id: true, kind: true, actorId: true },
  });

  // Una por una y condicional: si alguna se confirmó en el medio, no vence ni
  // se audita como vencida.
  for (const proposal of discarded) {
    const { count } = await db.agentProposal.updateMany({
      where: { id: proposal.id, status: "PENDING" },
      data: { status: "EXPIRED", resolvedAt: new Date(), error: DISCARDED_PROPOSAL_ERROR },
    });
    if (!count) continue;
    await auditProposal({
      actorId: proposal.actorId,
      action: "proposal.expire",
      entityType: "AgentProposal",
      entityId: proposal.id,
      metadata: { kind: proposal.kind, reason: "discarded" },
    });
  }
};
