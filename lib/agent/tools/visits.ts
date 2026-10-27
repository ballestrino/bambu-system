import "server-only";

import { tool } from "ai";

import type { VisitPayrollImpact } from "@/components/ops/visit-payroll-impact";
import {
  getAgentJobTakenStarts,
  getAgentOccurrence,
  getAgentTeamVisits,
  getAgentVisitOverlaps,
} from "@/data/agent/occurrences";
import { getAgentVisitEmployees, getAgentVisitJob } from "@/data/agent/visit-targets";
import { getPaidEmployeeIds } from "@/data/ops/visit-payroll-status";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { saveProposal } from "@/lib/agent/tools/proposals";
import { runTool, toolError } from "@/lib/agent/tool-result";
import { buildCreateVisitsProposal, resolveCreateVisits } from "@/lib/agent/visit-create-builder";
import { toVisitState } from "@/lib/agent/visit-format";
import {
  buildArchiveVisitProposal,
  buildUpdateVisitProposal,
  resolveVisitUpdate,
} from "@/lib/agent/visit-update-builder";
import {
  buildArchiveVisitWarnings,
  buildUpdateVisitWarnings,
  visitPayrollImpact,
} from "@/lib/agent/visit-warnings";
import {
  proposeArchiveVisitInputSchema,
  proposeCreateVisitsInputSchema,
  proposeUpdateVisitInputSchema,
} from "@/schemas/agent-visit-tools";

// Propuestas sobre visitas: como las de presupuestos, guardan una propuesta
// PENDING y nunca escriben la visita. Eso pasa solo al confirmar
// (lib/agent/visit-proposal-execute, desde actions/agent).
const NOT_FOUND = "No encontré esa visita. Buscala con queryOperations (kind visits, con day si sabés el día).";

const loadVisit = async (occurrenceId: string) => {
  const visit = await getAgentOccurrence(occurrenceId);
  return visit && !visit.archivedAt ? visit : null;
};

// Las empleadas que ya tienen pagos cargados del mes que salda esas horas.
const paidFor = async (impact: VisitPayrollImpact | null) => {
  if (!impact) return [];
  const result = await getPaidEmployeeIds({
    employeeIds: impact.employees.map((employee) => employee.id),
    paymentMonthKey: impact.paymentMonthKey,
  });
  return result.employeeIds ?? [];
};

export const createVisitTools = (ctx: AgentToolContext) => ({
  proposeCreateVisits: tool({
    description:
      "Prepara agendar visitas nuevas de un trabajo (hasta 20, con el mismo horario y equipo) para que el usuario las confirme en una tarjeta, donde puede desmarcar las que no quiere: no guarda nada. Los días van en dates (sueltos) o en repeatFrom, repeatTo y repeatWeekdays (por ejemplo los martes de un mes): el servidor calcula las fechas. Antes buscá el trabajo con queryOperations (kind jobs). Horarios en hora de Montevideo.",
    inputSchema: proposeCreateVisitsInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeCreateVisits", async () => {
        const job = await getAgentVisitJob(input.jobId);
        if (!job) return toolError("not_found", "No encontré ese trabajo. Buscalo con queryOperations (kind jobs).");
        const resolved = resolveCreateVisits(job, input);
        if (!resolved.ok) return toolError(resolved.code, resolved.message);

        const { slots, teamIds } = resolved;
        const [employees, takenStarts, teamVisits] = await Promise.all([
          getAgentVisitEmployees(teamIds),
          getAgentJobTakenStarts(job.id, slots.map((slot) => slot.start)),
          getAgentTeamVisits({ employeeIds: teamIds, start: slots[0].start, end: slots[slots.length - 1].end }),
        ]);
        const built = buildCreateVisitsProposal({
          job,
          input,
          slots,
          teamIds,
          employees,
          takenStarts,
          teamVisits,
          now: new Date(),
        });
        if (!built.ok) return toolError(built.code, built.message);
        return saveProposal(ctx, toolCallId, built);
      }),
  }),

  proposeUpdateVisit: tool({
    description:
      "Prepara cambiar una visita para que el usuario lo confirme en una tarjeta: no guarda nada. Sirve para moverla de horario, cambiar el equipo, el estado (cancelarla es CANCELED, no se hizo es SKIPPED), registrar el horario real, las notas o el nombre del cronograma. Antes buscá la visita con queryOperations. Horarios en hora de Montevideo; null en todo lo que no cambia.",
    inputSchema: proposeUpdateVisitInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeUpdateVisit", async () => {
        const visit = await loadVisit(input.occurrenceId);
        if (!visit) return toolError("not_found", NOT_FOUND);
        const employees = input.employeeIds ? await getAgentVisitEmployees(input.employeeIds) : [];
        const resolved = resolveVisitUpdate({ visit, input, employees });
        if (!resolved.ok) return toolError(resolved.code, resolved.message);

        const { before, after, patch } = resolved;
        const blocking = after.status === "SCHEDULED" || after.status === "DONE";
        const rescheduled = Boolean(patch.scheduledStartAt || patch.scheduledEndAt || patch.employeeIds || patch.status);
        const [overlaps, paidBefore, paidAfter] = await Promise.all([
          blocking && rescheduled
            ? getAgentVisitOverlaps({
                employeeIds: after.employees.map((employee) => employee.id),
                start: after.scheduledStartAt,
                end: after.scheduledEndAt,
                excludeId: visit.id,
              })
            : [],
          paidFor(visitPayrollImpact(before)),
          paidFor(visitPayrollImpact(after)),
        ]);
        const warnings = buildUpdateVisitWarnings({
          before,
          after,
          notices: resolved.notices,
          overlaps,
          paid: { before: paidBefore, after: paidAfter },
          now: new Date(),
        });
        return saveProposal(ctx, toolCallId, buildUpdateVisitProposal(visit, resolved, warnings));
      }),
  }),

  proposeArchiveVisit: tool({
    description:
      "Prepara eliminar una visita de la agenda (queda archivada, como \"Eliminar visita\") para que el usuario lo confirme: no borra nada. Solo si piden eliminarla o borrarla; para cancelarla usá proposeUpdateVisit con status CANCELED.",
    inputSchema: proposeArchiveVisitInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeArchiveVisit", async () => {
        const visit = await loadVisit(input.occurrenceId);
        if (!visit) return toolError("not_found", NOT_FOUND);
        const before = toVisitState(visit);
        const warnings = buildArchiveVisitWarnings(before, await paidFor(visitPayrollImpact(before)));
        return saveProposal(ctx, toolCallId, buildArchiveVisitProposal(visit, warnings));
      }),
  }),
});
