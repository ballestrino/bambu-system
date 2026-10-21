import "server-only";

import { createJobOccurrences } from "@/actions/ops/job-occurrence-batch";
import { archiveJobOccurrence, updateJobOccurrence } from "@/actions/ops/job-occurrences";
import { getAgentJobTakenStarts, getAgentVisitState } from "@/data/agent/occurrences";
import { getAgentVisitEmployees, getAgentVisitJob } from "@/data/agent/visit-targets";
import type { ProposalResult } from "@/lib/agent/proposals";
import {
  checkCreateVisitsPreconditions,
  checkVisitProposalPreconditions,
} from "@/lib/agent/visit-proposal-preconditions";
import { visitResult } from "@/lib/agent/visit-proposals";
import type { ParsedVisitProposal } from "@/schemas/agent-proposals";
import type { CreateVisitsPayload } from "@/schemas/agent-visit-proposals";

type Outcome = { ok: true; result: ProposalResult } | { ok: false; error: string };

const failure = (error: string | undefined, fallback: string): Outcome => ({ ok: false, error: error || fallback });

// Un lote se escribe entero o nada (createJobOccurrences): si falla, el
// modelo puede proponerlo de nuevo sin duplicar visitas.
const executeCreateVisits = async (payload: CreateVisitsPayload): Promise<Outcome> => {
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
    ? { ok: true, result: visitResult(result.occurrences.map((occurrence) => occurrence.id)) }
    : failure(result.error, "No se pudieron crear las visitas.");
};

// Ejecuta una propuesta de visitas ya reclamada (solo lo llama confirmar):
// re-valida contra una lectura fresca y usa las acciones de la pantalla, con
// sus propios chequeos de sesión y validación. No es "use server": no es un
// endpoint.
export const executeVisitProposal = async (proposal: ParsedVisitProposal): Promise<Outcome> => {
  if (proposal.kind === "CREATE_VISITS") return executeCreateVisits(proposal.payload);

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
