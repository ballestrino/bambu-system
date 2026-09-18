import "server-only";

import type { MailMemoryScope } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

const SCOPE_LABELS: Record<MailMemoryScope, string> = {
  CONTACT: "Contacto",
  ORGANIZATION: "Organización",
  POLICY: "Política",
  STYLE: "Estilo",
};

// La memoria que el equipo ya aprobó para el agente de correo: organización,
// políticas y estilo. Nunca datos de un contacto. El agente la lee y no la
// modifica.
export const getApprovedAgentKnowledge = async () => {
  await requireAdminSession();
  const memories = await db.mailMemory.findMany({
    where: {
      status: "APPROVED",
      scope: { in: ["ORGANIZATION", "POLICY", "STYLE"] },
      contactEmail: null,
      OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
    },
    orderBy: [{ scope: "asc" }, { updatedAt: "desc" }],
    take: 30,
    select: { scope: true, key: true, value: true },
  });

  return memories.map(
    (memory) =>
      `- ${SCOPE_LABELS[memory.scope]} · ${memory.key}: ${memory.value.replace(/\s+/g, " ").trim().slice(0, 400)}`
  );
};
