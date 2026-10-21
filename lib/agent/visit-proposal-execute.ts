import "server-only";

import { archiveJobOccurrence, updateJobOccurrence } from "@/actions/ops/job-occurrences";
import { getAgentVisitState } from "@/data/agent/occurrences";
import { getAgentVisitEmployees } from "@/data/agent/visit-targets";
import type { ProposalResult } from "@/lib/agent/proposals";
import { checkVisitProposalPreconditions } from "@/lib/agent/visit-proposal-preconditions";
import { visitResult } from "@/lib/agent/visit-proposals";
import type { ParsedVisitProposal } from "@/schemas/agent-proposals";

type Outcome = { ok: true; result: ProposalResult } | { ok: false; error: string };

const failure = (error: string | undefined, fallback: string): Outcome => ({ ok: false, error: error || fallback });

// Ejecuta una propuesta de visitas ya reclamada (solo lo llama confirmar):
// re-valida contra una lectura fresca y usa las acciones de la pantalla, con
// sus propios chequeos de sesión y validación. No es "use server": no es un
// endpoint.
export const executeVisitProposal = async (proposal: ParsedVisitProposal): Promise<Outcome> => {
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
