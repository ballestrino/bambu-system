import type { AgentProposalKind, ProposalResult } from "@/lib/agent/proposals";
import { MAX_BATCH_OCCURRENCES } from "@/schemas/ops/job-occurrence-batch";

// Propuestas del agente sobre visitas (JobOccurrence): crear un lote de un
// trabajo, cambiar una o eliminarla (archivarla, como "Eliminar visita").
// Puro: lo usan las tools, confirmar, el prompt y la tarjeta.
export const VISIT_PROPOSAL_KINDS = [
  "CREATE_VISITS",
  "UPDATE_VISIT",
  "UPDATE_VISITS",
  "ARCHIVE_VISIT",
] as const satisfies readonly AgentProposalKind[];

export type VisitProposalKind = (typeof VISIT_PROPOSAL_KINDS)[number];

export const isVisitProposalKind = (kind: AgentProposalKind): kind is VisitProposalKind =>
  (VISIT_PROPOSAL_KINDS as readonly string[]).includes(kind);

// Las propuestas de varias visitas: la tarjeta tiene una casilla por visita
// (summary.items) y confirmar recibe las marcadas.
export const isVisitBatchKind = (kind: AgentProposalKind) => kind === "CREATE_VISITS" || kind === "UPDATE_VISITS";

// Lo que entra en una propuesta de crear: lo mismo que crea el lote.
export const MAX_PROPOSED_VISITS = MAX_BATCH_OCCURRENCES;

export const VISITS_URL = "/dashboard/calendar";

export const VISIT_STALE_MESSAGE = "La visita cambió desde la propuesta: pedile al asistente una nueva.";

export const VISIT_GONE_MESSAGE = "La visita ya no existe o fue eliminada.";

export const visitResult = (occurrenceIds: string[], visitIndexes?: number[]): ProposalResult => ({
  label: "Visitas",
  url: VISITS_URL,
  budgetId: null,
  slug: null,
  officialBudgetId: null,
  officialVersion: null,
  occurrenceIds,
  ...(visitIndexes ? { visitIndexes } : {}),
});
