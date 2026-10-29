import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { readTeamRules, type InstructionChange } from "@/lib/agent/team-instructions";

// Lecturas de las instrucciones del equipo. Son del equipo: cualquier admin
// las ve. Sin versiones, la vigente es la 0 sin reglas.
export const getCurrentInstructions = async () => {
  await requireAdminSession();
  const latest = await db.agentInstructionVersion.findFirst({
    orderBy: { version: "desc" },
    select: { version: true, rules: true },
  });
  return latest ? { version: latest.version, rules: readTeamRules(latest.rules) } : { version: 0, rules: [] };
};

// La pantalla: todas las versiones, de la más nueva a la más vieja, con qué
// cambió, quién y de qué conversación salió.
export const listInstructionVersions = async () => {
  await requireAdminSession();
  const rows = await db.agentInstructionVersion.findMany({
    orderBy: { version: "desc" },
    take: 200,
    select: {
      version: true,
      rules: true,
      change: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      sourceConversation: { select: { id: true, title: true } },
    },
  });
  return rows.map((row) => ({
    version: row.version,
    rules: readTeamRules(row.rules),
    change: row.change as InstructionChange,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy?.name ?? null,
    conversation: row.sourceConversation,
  }));
};
