import "server-only";

import { createJobOccurrences, updateJobOccurrences } from "@/actions/ops/job-occurrence-batch";
import { archiveJobOccurrence, updateJobOccurrence } from "@/actions/ops/job-occurrences";
import { getAgentJobTakenStarts, getAgentVisitState, getAgentVisitStates } from "@/data/agent/occurrences";
import { getAgentVisitEmployees, getAgentVisitJob } from "@/data/agent/visit-targets";
import type { ProposalResult } from "@/lib/agent/proposals";
import {
  checkCreateVisitsPreconditions,
  checkVisitProposalPreconditions,
  selectProposedVisits,
} from "@/lib/agent/visit-proposal-preconditions";
import { visitResult } from "@/lib/agent/visit-proposals";
import type { ParsedVisitProposal } from "@/schemas/agent-proposals";
import type { CreateVisitsPayload, UpdateVisitsPayload } from "@/schemas/agent-visit-proposals";

type Outcome = { ok: true; result: ProposalResult } | { ok: false; error: string };

const SELECTION_MISMATCH = "Las visitas marcadas no coinciden con la propuesta: pedile al asistente una nueva.";

const failure = (error: string | undefined, fallback: string): Outcome => ({ ok: false, error: error || fallback });

// Solo las visitas marcadas en la tarjeta. Se escriben enteras o ninguna
// (createJobOccurrences): si falla, el modelo puede proponerlas de nuevo sin
// duplicar visitas.
const executeCreateVisits = async (stored: CreateVisitsPayload, visitIndexes?: number[]): Promise<Outcome> => {
  const selection = selectProposedVisits(stored.visits, visitIndexes);
  if (!selection) return { ok: false, error: SELECTION_MISMATCH };
  const { indexes } = selection;
  const payload = { ...stored, visits: selection.visits };
  const starts = payload.visits.map((visit) => new Date(visit.scheduledStartAt));
  const [job, employees, takenStarts] = await Promise.all([
    getAgentVisitJob(payload.jobId),
    getAgentVisitEmployees(payload.employeeIds),
    getAgentJobTakenStarts(payload.jobId, starts),
  ]);
  const blocked = checkCreateVisitsPreconditions(payload, { job, employees, takenStarts });
  if (blocked) return { ok: false, error: blocked };

  const result = await createJobOccurrences(payload);
  return result.occurrences
    ? { ok: true, result: visitResult(result.occurrences.map((occurrence) => occurrence.id), indexes) }
    : failure(result.error, "No se pudieron crear las visitas.");
};

// Cambiar un lote: cada visita marcada pasa las precondiciones de cambiar
// una, y después se escriben todas juntas o ninguna.
const executeUpdateVisits = async (stored: UpdateVisitsPayload, visitIndexes?: number[]): Promise<Outcome> => {
  const selection = selectProposedVisits(stored.visits, visitIndexes);
  if (!selection) return { ok: false, error: SELECTION_MISMATCH };
  const { visits, indexes } = selection;
  const [states, employees] = await Promise.all([
    getAgentVisitStates(visits.map((visit) => visit.occurrenceId)),
    getAgentVisitEmployees([...new Set(visits.flatMap((visit) => visit.patch.employeeIds ?? []))]),
  ]);
  for (const visit of visits) {
    const state = states.get(visit.occurrenceId) ?? null;
    const blocked = checkVisitProposalPreconditions({ kind: "UPDATE_VISIT", payload: visit }, state, employees);
    if (blocked) return { ok: false, error: `${blocked} No se cambió ninguna.` };
  }

  const result = await updateJobOccurrences(visits.map((visit) => ({ occurrenceId: visit.occurrenceId, values: visit.patch })));
  return result.occurrences
    ? { ok: true, result: visitResult(visits.map((visit) => visit.occurrenceId), indexes) }
    : failure(result.error, "No se pudieron cambiar las visitas.");
};

// Ejecuta una propuesta de visitas ya reclamada (solo lo llama confirmar):
// re-valida contra una lectura fresca y usa las acciones de la pantalla, con
// sus propios chequeos de sesión y validación. No es "use server": no es un
// endpoint. visitIndexes solo llega con un lote (lo filtra confirmar).
export const executeVisitProposal = async (proposal: ParsedVisitProposal, visitIndexes?: number[]): Promise<Outcome> => {
  if (proposal.kind === "CREATE_VISITS") return executeCreateVisits(proposal.payload, visitIndexes);
  if (proposal.kind === "UPDATE_VISITS") return executeUpdateVisits(proposal.payload, visitIndexes);

  const { occurrenceId } = proposal.payload;
  const [state, employees] = await Promise.all([
    getAgentVisitState(occurrenceId),
    proposal.kind === "UPDATE_VISIT" ? getAgentVisitEmployees(proposal.payload.patch.employeeIds ?? []) : [],
  ]);
  const blocked = checkVisitProposalPreconditions(proposal, state, employees);
  if (blocked) return { ok: false, error: blocked };

  if (proposal.kind === "UPDATE_VISIT") {
    const result = await updateJobOccurrence(occurrenceId, proposal.payload.patch);
    return result.occurrence
      ? { ok: true, result: visitResult([occurrenceId]) }
      : failure(result.error, "No se pudo guardar el cambio de la visita.");
  }
  const result = await archiveJobOccurrence(occurrenceId);
  return result.occurrence
    ? { ok: true, result: visitResult([occurrenceId]) }
    : failure(result.error, "No se pudo eliminar la visita.");
};
