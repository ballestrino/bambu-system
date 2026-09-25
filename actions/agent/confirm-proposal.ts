"use server";

import { createBudget } from "@/actions/budgets/create-budget";
import { duplicateBudget } from "@/actions/budgets/duplicate-budget";
import { updateBudget } from "@/actions/budgets/update-budget";
import { publishOfficialBudget } from "@/actions/official-budgets/official-budget-actions";
import { getAgentBudgetState } from "@/data/agent/budgets";
import { auditProposal, markProposalExpired } from "@/lib/agent/proposal-store";
import {
  checkProposalPreconditions,
  describeConfirmOutcome,
  getBudgetUrl,
  getOfficialBudgetUrl,
  getProposalBudgetId,
  PROPOSAL_STALE_MESSAGE,
  proposalSelect,
  serializeProposal,
  type AgentProposalKind,
  type ProposalResult,
  type ProposalSummary,
} from "@/lib/agent/proposals";
import { BUDGET_CHANGED_MESSAGE } from "@/lib/budget-errors";
import { db } from "@/lib/db";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";
import {
  agentProposalIdSchema,
  parseProposalPayload,
  type ParsedProposal,
} from "@/schemas/agent-proposals";

type Outcome = { ok: true; result: ProposalResult } | { ok: false; error: string };

const budgetResult = (
  budget: { id: string; slug: string; name: string },
  official: { id: string; currentVersion: number } | null = null
): ProposalResult => ({
  label: budget.name,
  url: getBudgetUrl(budget.slug),
  budgetId: budget.id,
  slug: budget.slug,
  officialBudgetId: official?.id ?? null,
  officialVersion: official?.currentVersion ?? null,
});

// Sin mensaje (o con el "error" genérico que devolvían antes las acciones de presupuestos) se usa el
// de cada tipo. El compare-and-set de updateBudget se informa como propuesta
// vieja.
const failure = (error: string | undefined, fallback: string): Outcome => ({
  ok: false,
  error:
    error === BUDGET_CHANGED_MESSAGE
      ? PROPOSAL_STALE_MESSAGE
      : !error || error === "error"
        ? fallback
        : error,
});

// Las cuatro escrituras son las acciones existentes, con sus propios chequeos
// de sesión y validación: la propuesta nunca escribe por su cuenta.
const execute = async (proposal: ParsedProposal, summary: ProposalSummary): Promise<Outcome> => {
  switch (proposal.kind) {
    case "CREATE_BUDGET": {
      const result = await createBudget(proposal.payload.values);
      return result.budget
        ? { ok: true, result: budgetResult(result.budget) }
        : failure(result.error, "No se pudo crear el presupuesto.");
    }
    case "UPDATE_BUDGET": {
      // expectedUpdatedAt cierra la carrera entre la re-validación y la
      // escritura: otra propuesta o un guardado a mano en el medio la frenan.
      const { budgetId, newSlug, values, baseUpdatedAt } = proposal.payload;
      const result = await updateBudget(budgetId, newSlug, values, { expectedUpdatedAt: baseUpdatedAt });
      return result.budget
        ? { ok: true, result: budgetResult(result.budget, result.budget.officialBudget) }
        : failure(result.error, "No se pudo guardar el presupuesto.");
    }
    case "DUPLICATE_BUDGET": {
      const result = await duplicateBudget(proposal.payload.budgetId);
      return result.budget
        ? { ok: true, result: budgetResult(result.budget) }
        : failure(result.error, "No se pudo duplicar el presupuesto.");
    }
    case "PUBLISH_OFFICIAL_BUDGET": {
      const { sourceBudgetId } = proposal.payload;
      const result = await publishOfficialBudget({ sourceBudgetId });
      if (!result.officialBudgetId) {
        return failure(result.error, "No se pudo publicar el presupuesto oficial.");
      }
      return {
        ok: true,
        result: {
          label: `${summary.name} (oficial)`,
          url: getOfficialBudgetUrl(result.officialBudgetId),
          budgetId: sourceBudgetId,
          slug: summary.slug,
          officialBudgetId: result.officialBudgetId,
          officialVersion: result.version ?? null,
        },
      };
    }
  }
};

// Re-valida el payload guardado y las precondiciones contra una lectura
// fresca antes de ejecutar. Un error inesperado deja la propuesta FAILED.
const runClaimed = async (
  stored: { kind: AgentProposalKind; payload: unknown; summary: unknown }
): Promise<Outcome> => {
  try {
    const proposal = parseProposalPayload(stored.kind, stored.payload);
    if (!proposal) {
      return { ok: false, error: "La propuesta guardada no es válida: pedile al asistente una nueva." };
    }
    const budgetId = getProposalBudgetId(proposal);
    const state = budgetId ? await getAgentBudgetState(budgetId) : null;
    const blocked = checkProposalPreconditions(proposal, state);
    if (blocked) return { ok: false, error: blocked };
    return await execute(proposal, stored.summary as ProposalSummary);
  } catch (error) {
    console.error("Agent proposal execution failed:", error);
    return {
      ok: false,
      error: "No se pudo completar la propuesta: revisá el presupuesto y pedile al asistente una nueva.",
    };
  }
};

const loadProposal = async (id: string) =>
  serializeProposal(
    await db.agentProposal.findUniqueOrThrow({ where: { id }, select: proposalSelect })
  );

// Confirmar ejecuta la escritura propuesta una sola vez. El claim atómico
// (PENDING y sin vencer → EXECUTING) hace que un doble click o un reintento
// devuelvan el estado guardado en vez de escribir dos veces.
export const confirmAgentProposal = async (proposalId: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedId = agentProposalIdSchema.safeParse(proposalId);
    if (!parsedId.success) return { error: "Propuesta inválida" };
    const id = parsedId.data;
    const actorId = session.user.id;

    const stored = await db.agentProposal.findFirst({
      where: { id, actorId },
      select: { kind: true, payload: true, summary: true },
    });
    if (!stored) return { error: "Propuesta no encontrada" };

    const now = new Date();
    const claimed = await db.agentProposal.updateMany({
      where: { id, actorId, status: "PENDING", expiresAt: { gt: now } },
      data: { status: "EXECUTING" },
    });
    if (!claimed.count) {
      await markProposalExpired(id, actorId, now);
      return describeConfirmOutcome(await loadProposal(id));
    }

    const outcome = await runClaimed(stored);
    // La auditoría va primero: la escritura ya pasó (o falló) y queda
    // registrada aunque el cierre de abajo no llegue.
    await auditProposal({
      actorId,
      action: outcome.ok ? "proposal.confirm" : "proposal.fail",
      entityType: "AgentProposal",
      entityId: id,
      metadata: outcome.ok
        ? { kind: stored.kind, ...outcome.result }
        : { kind: stored.kind, error: outcome.error },
    });
    const resolvedAt = new Date();
    await db.agentProposal.updateMany({
      where: { id, status: "EXECUTING" },
      data: outcome.ok
        ? { status: "CONFIRMED", resolvedAt, result: outcome.result }
        : { status: "FAILED", resolvedAt, error: outcome.error },
    });
    const saved = await db.agentProposal.findUnique({ where: { id }, select: proposalSelect });
    // Si borraron la conversación mientras se ejecutaba, la propuesta ya no
    // existe: se responde con lo que pasó con la escritura.
    if (!saved) {
      return outcome.ok ? { success: "Propuesta confirmada", result: outcome.result } : { error: outcome.error };
    }
    return describeConfirmOutcome(serializeProposal(saved));
  } catch (error) {
    console.error("Error confirming agent proposal:", error);
    return {
      error: error instanceof AdminAuthorizationError ? error.message : "Error al confirmar la propuesta",
    };
  }
};
