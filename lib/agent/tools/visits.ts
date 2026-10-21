import "server-only";

import { tool } from "ai";

import type { VisitPayrollImpact } from "@/components/ops/visit-payroll-impact";
import { getAgentOccurrence, getAgentVisitOverlaps } from "@/data/agent/occurrences";
import { getAgentVisitEmployees } from "@/data/agent/visit-targets";
import { getPaidEmployeeIds } from "@/data/ops/visit-payroll-status";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { saveProposal } from "@/lib/agent/tools/proposals";
import { runTool, toolError } from "@/lib/agent/tool-result";
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
import { proposeArchiveVisitInputSchema, proposeUpdateVisitInputSchema } from "@/schemas/agent-visit-tools";

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
