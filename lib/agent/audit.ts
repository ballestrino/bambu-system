import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type AgentAuditInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

// Calcado de recordMailAudit: quién hizo qué sobre qué, sin contenido de
// mensajes.
export const recordAgentAudit = (input: AgentAuditInput) =>
  db.agentAuditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
