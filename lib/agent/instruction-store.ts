import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { recordAgentAudit } from "@/lib/agent/audit";
import type { ProposalResult } from "@/lib/agent/proposals";
import {
  applyInstructionChange,
  checkRuleText,
  instructionsResult,
  INSTRUCTIONS_STALE_MESSAGE,
  readTeamRules,
  type InstructionChange,
  type TeamRule,
} from "@/lib/agent/team-instructions";
import { db } from "@/lib/db";
import type { ParsedInstructionsProposal } from "@/schemas/agent-proposals";

type Outcome = { ok: true; result: ProposalResult } | { ok: false; error: string };

const toJson = (value: unknown) => value as Prisma.InputJsonValue;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const loadVersion = async (version: number) => {
  if (version === 0) return { rules: [] as TeamRule[] };
  const row = await db.agentInstructionVersion.findUnique({ where: { version }, select: { rules: true } });
  return row ? { rules: readTeamRules(row.rules) } : null;
};

const latestVersion = async () =>
  (await db.agentInstructionVersion.findFirst({ orderBy: { version: "desc" }, select: { version: true } }))
    ?.version ?? 0;

// Guarda la versión base + 1. Si otra se guardó en el medio, el número ya
// existe (único) o la base ya no es la última: falla como vieja y no pisa nada.
const writeNextVersion = async (input: {
  baseVersion: number;
  rules: TeamRule[];
  change: InstructionChange;
  actorId: string;
  conversationId: string | null;
}): Promise<Outcome> => {
  if ((await latestVersion()) !== input.baseVersion) return { ok: false, error: INSTRUCTIONS_STALE_MESSAGE };
  const version = input.baseVersion + 1;
  try {
    await db.agentInstructionVersion.create({
      data: {
        version,
        rules: toJson(input.rules),
        change: toJson(input.change),
        createdById: input.actorId,
        sourceConversationId: input.conversationId,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: INSTRUCTIONS_STALE_MESSAGE };
    throw error;
  }
  await recordAgentAudit({
    actorId: input.actorId,
    action: "instructions.version",
    entityType: "AgentInstructionVersion",
    entityId: String(version),
    metadata: toJson({ ...input.change, conversationId: input.conversationId }),
  }).catch((error) => console.error("Agent instructions audit failed:", error));
  return { ok: true, result: instructionsResult(version) };
};

// Confirmar un cambio propuesto: re-valida el texto (la regla fija no se
// toca ni con un payload armado a mano) y que la regla siga en la base.
export const executeInstructionsProposal = async (
  proposal: ParsedInstructionsProposal,
  context: { actorId: string; conversationId: string }
): Promise<Outcome> => {
  const { action, ruleId, text, baseVersion } = proposal.payload;
  if (action !== "REMOVE") {
    const invalid = checkRuleText(text ?? "");
    if (invalid && !invalid.ok) return { ok: false, error: invalid.message };
  }
  const base = await loadVersion(baseVersion);
  if (!base) return { ok: false, error: INSTRUCTIONS_STALE_MESSAGE };
  const before = ruleId ? base.rules.find((rule) => rule.id === ruleId) : undefined;
  if (action !== "ADD" && !before) return { ok: false, error: INSTRUCTIONS_STALE_MESSAGE };

  const newId = `r${randomUUID().replace(/-/g, "").slice(0, 7)}`;
  return writeNextVersion({
    baseVersion,
    rules: applyInstructionChange(base.rules, proposal.payload, newId),
    change: { action, ruleId: before?.id ?? newId, before: before?.text ?? null, after: text },
    actorId: context.actorId,
    conversationId: context.conversationId,
  });
};

// Restaurar desde la pantalla: una versión nueva con las reglas de la vieja.
export const restoreInstructionVersion = async (input: {
  version: number;
  currentVersion: number;
  actorId: string;
}): Promise<Outcome> => {
  if (input.version >= input.currentVersion) return { ok: false, error: "Esa ya es la versión vigente." };
  const restored = await loadVersion(input.version);
  if (!restored) return { ok: false, error: "Esa versión no existe." };
  return writeNextVersion({
    baseVersion: input.currentVersion,
    rules: restored.rules,
    change: { action: "RESTORE", restoredFrom: input.version },
    actorId: input.actorId,
    conversationId: null,
  });
};
