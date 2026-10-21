import { VISIT_GONE_MESSAGE, VISIT_STALE_MESSAGE } from "@/lib/agent/visit-proposals";
import type { ParsedVisitProposal } from "@/schemas/agent-proposals";

// Precondiciones de confirmar una propuesta de visitas, contra una lectura
// fresca. Puro: lo usan el ejecutor y check:agent-visits. null = se puede
// ejecutar.
export type VisitProposalState = {
  archivedAt: Date | null;
  updatedAt: Date;
  employeeIds: string[];
} | null;

export type VisitProposalEmployee = { id: string; name: string; archivedAt: Date | null };

const sameIds = (left: string[], right: string[]) => [...left].sort().join() === [...right].sort().join();

export const checkVisitProposalPreconditions = (
  proposal: ParsedVisitProposal,
  state: VisitProposalState,
  employees: VisitProposalEmployee[] = []
) => {
  if (!state || state.archivedAt) return VISIT_GONE_MESSAGE;
  if (state.updatedAt.toISOString() !== proposal.payload.baseUpdatedAt) return VISIT_STALE_MESSAGE;
  if (proposal.kind === "ARCHIVE_VISIT") return null;

  // Quitar una empleada desde el trabajo borra su asignación sin tocar el
  // updatedAt de la visita: el equipo se compara aparte.
  if (!sameIds(state.employeeIds, proposal.payload.baseEmployeeIds)) return VISIT_STALE_MESSAGE;
  const requested = proposal.payload.patch.employeeIds ?? [];
  const known = new Map(employees.map((employee) => [employee.id, employee]));
  const added = requested.filter((id) => !state.employeeIds.includes(id));
  if (added.some((id) => !known.has(id))) return "Una empleada de la propuesta ya no existe: pedile al asistente una nueva.";
  const archived = added.map((id) => known.get(id)!).find((employee) => employee.archivedAt);
  return archived ? `${archived.name} fue archivada: pedile al asistente una nueva.` : null;
};
