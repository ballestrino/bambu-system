import "server-only";

import { auditProposal } from "@/lib/agent/proposal-store";
import { MEMORY_GONE_MESSAGE, MEMORY_STALE_MESSAGE, memoryResult } from "@/lib/agent/memory";
import type { ProposalResult } from "@/lib/agent/proposals";
import { db } from "@/lib/db";
import type { ParsedMemoryProposal } from "@/schemas/agent-proposals";

type Outcome = { ok: true; result: ProposalResult } | { ok: false; error: string };

// Confirmar una propuesta de recordar: crea la memoria o reemplaza el texto
// de una existente. Reemplazar es un compare-and-set del updatedAt de cuando
// se propuso: si alguien la editó desde la pantalla, no se pisa.
export const executeMemoryProposal = async (
  proposal: ParsedMemoryProposal,
  context: { actorId: string; conversationId: string }
): Promise<Outcome> => {
  const { kind, text, expiresAt, replacesId, baseUpdatedAt, source } = proposal.payload;
  const expires = expiresAt ? new Date(expiresAt) : null;

  if (!replacesId) {
    const memory = await db.agentMemory.create({
      data: {
        kind,
        text,
        expiresAt: expires,
        sourceConversationId: context.conversationId,
        createdById: context.actorId,
        approvedById: context.actorId,
      },
      select: { id: true },
    });
    await auditProposal({
      actorId: context.actorId,
      action: "memory.create",
      entityType: "AgentMemory",
      entityId: memory.id,
      metadata: { kind, source, conversationId: context.conversationId },
    });
    return { ok: true, result: memoryResult(memory.id) };
  }

  const current = await db.agentMemory.findUnique({ where: { id: replacesId }, select: { text: true, kind: true } });
  if (!current) return { ok: false, error: MEMORY_GONE_MESSAGE };
  const { count } = await db.agentMemory.updateMany({
    where: { id: replacesId, ...(baseUpdatedAt ? { updatedAt: new Date(baseUpdatedAt) } : {}) },
    data: {
      kind,
      text,
      expiresAt: expires,
      sourceConversationId: context.conversationId,
      approvedById: context.actorId,
      approvedAt: new Date(),
    },
  });
  if (!count) return { ok: false, error: MEMORY_STALE_MESSAGE };
  await auditProposal({
    actorId: context.actorId,
    action: "memory.update",
    entityType: "AgentMemory",
    entityId: replacesId,
    metadata: { kind, source, previousKind: current.kind, previousText: current.text, via: "proposal" },
  });
  return { ok: true, result: memoryResult(replacesId) };
};
