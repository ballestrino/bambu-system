import { formatVisitRange } from "@/lib/agent/visit-time";
import { VISIT_GONE_MESSAGE, VISIT_STALE_MESSAGE } from "@/lib/agent/visit-proposals";
import type { ParsedVisitProposal } from "@/schemas/agent-proposals";
import type { CreateVisitsPayload } from "@/schemas/agent-visit-proposals";

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

export type ParsedVisitEdit = Exclude<ParsedVisitProposal, { kind: "CREATE_VISITS" }>;

export const checkVisitProposalPreconditions = (
  proposal: ParsedVisitEdit,
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

// Crear un lote: el trabajo sigue vivo, las empleadas existen y no se
// archivaron, y ninguna visita del trabajo ya empieza a esa hora (la misma
// propuesta confirmada dos veces, o una visita creada en el medio).
export type CreateVisitsState = {
  job: { name: string; status: string; archivedAt: Date | null } | null;
  employees: VisitProposalEmployee[];
  takenStarts: Date[];
};

// Las visitas marcadas en la tarjeta, en el orden del lote (sin selección,
// todas). Una posición fuera del lote es una selección armada a mano: null.
export const selectProposedVisits = (payload: CreateVisitsPayload, visitIndexes?: number[]) => {
  const indexes = visitIndexes ?? payload.visits.map((_, index) => index);
  if (indexes.some((index) => index >= payload.visits.length)) return null;
  const chosen = new Set(indexes);
  return {
    indexes: [...chosen].sort((left, right) => left - right),
    payload: { ...payload, visits: payload.visits.filter((_, index) => chosen.has(index)) },
  };
};

export const checkCreateVisitsPreconditions =(payload: CreateVisitsPayload, state: CreateVisitsState) => {
  const { job } = state;
  if (!job) return "El trabajo ya no existe: pedile al asistente una nueva.";
  if (job.archivedAt || job.status === "ARCHIVED") return `${job.name} fue archivado: no se le pueden agendar visitas.`;
  const known = new Map(state.employees.map((employee) => [employee.id, employee]));
  if (payload.employeeIds.some((id) => !known.has(id))) return "Una empleada de la propuesta ya no existe: pedile al asistente una nueva.";
  const archived = payload.employeeIds.map((id) => known.get(id)!).find((employee) => employee.archivedAt);
  if (archived) return `${archived.name} fue archivada: pedile al asistente una nueva.`;
  const taken = new Set(state.takenStarts.map((start) => start.getTime()));
  const repeated = payload.visits.find((visit) => taken.has(new Date(visit.scheduledStartAt).getTime()));
  if (!repeated) return null;
  const when = formatVisitRange(new Date(repeated.scheduledStartAt), new Date(repeated.scheduledEndAt));
  return `${job.name} ya tiene una visita el ${when.split("–")[0]}: no se creó ninguna. Pedile al asistente una nueva.`;
};
