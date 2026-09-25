import type { ProposalBudgetState } from "@/lib/agent/proposals";
import type { ParsedProposal } from "@/schemas/agent-proposals";

// Precondiciones de confirmar una propuesta. Puro: lo usan confirmar y
// check:agent-proposals.
export const PROPOSAL_STALE_MESSAGE =
  "El presupuesto cambió desde la propuesta: pedile al asistente una nueva.";

export const getProposalBudgetId = (proposal: ParsedProposal) => {
  if (proposal.kind === "CREATE_BUDGET") return null;
  if (proposal.kind === "PUBLISH_OFFICIAL_BUDGET") return proposal.payload.sourceBudgetId;
  return proposal.payload.budgetId;
};

// Se re-valida al confirmar, contra una lectura fresca: el presupuesto tiene
// que ser el mismo que mostró la tarjeta. null = se puede ejecutar.
export const checkProposalPreconditions = (
  proposal: ParsedProposal,
  state: ProposalBudgetState | null
) => {
  if (proposal.kind === "CREATE_BUDGET") return null;
  if (!state) return "El presupuesto ya no existe.";
  if (state.updatedAt.toISOString() !== proposal.payload.baseUpdatedAt) return PROPOSAL_STALE_MESSAGE;
  if (proposal.kind === "UPDATE_BUDGET") {
    return (state.officialBudget?.id ?? null) === proposal.payload.officialBudgetId
      ? null
      : PROPOSAL_STALE_MESSAGE;
  }
  // Budgets are shared by every admin: any admin duplicates any.
  if (proposal.kind === "DUPLICATE_BUDGET") return null;
  return state.officialBudget ? "El presupuesto ya está publicado como oficial." : null;
};
