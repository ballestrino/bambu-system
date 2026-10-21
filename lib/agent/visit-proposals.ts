import type { AgentProposalKind, ProposalResult } from "@/lib/agent/proposals";

// Propuestas del agente sobre visitas (JobOccurrence): cambiar una o
// eliminarla (archivarla, como "Eliminar visita"). Puro: lo usan las tools,
// confirmar, el prompt y la tarjeta.
export const VISIT_PROPOSAL_KINDS = ["UPDATE_VISIT", "ARCHIVE_VISIT"] as const satisfies readonly AgentProposalKind[];

export type VisitProposalKind = (typeof VISIT_PROPOSAL_KINDS)[number];

export const isVisitProposalKind = (kind: AgentProposalKind): kind is VisitProposalKind =>
  (VISIT_PROPOSAL_KINDS as readonly string[]).includes(kind);

export const VISITS_URL = "/dashboard/calendar";

export const VISIT_STALE_MESSAGE = "La visita cambió desde la propuesta: pedile al asistente una nueva.";

export const VISIT_GONE_MESSAGE = "La visita ya no existe o fue eliminada.";

export const visitResult = (occurrenceIds: string[]): ProposalResult => ({
  label: "Visitas",
  url: VISITS_URL,
  budgetId: null,
  slug: null,
  officialBudgetId: null,
  officialVersion: null,
  occurrenceIds,
});
