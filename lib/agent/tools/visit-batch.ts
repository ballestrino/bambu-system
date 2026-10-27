import "server-only";

import { tool } from "ai";

import { getAgentOccurrencesByIds, getAgentVisitOverlaps } from "@/data/agent/occurrences";
import { getAgentVisitEmployees } from "@/data/agent/visit-targets";
import { getPaidEmployeeIds } from "@/data/ops/visit-payroll-status";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { saveProposal } from "@/lib/agent/tools/proposals";
import { runTool, toolError } from "@/lib/agent/tool-result";
import {
  buildUpdateVisitsProposal,
  resolveUpdateVisits,
  type ResolvedBatchVisit,
} from "@/lib/agent/visit-batch-update-builder";
import { batchPayrollWarnings, visitPayrollImpact } from "@/lib/agent/visit-warnings";
import { proposeUpdateVisitsInputSchema } from "@/schemas/agent-visit-tools";

// Cambiar varias visitas con una sola propuesta (y una sola tarjeta). Como
// las demás, nunca escribe: eso pasa al confirmar.
const isBlocking = (status: string) => status === "SCHEDULED" || status === "DONE";

// Solo las que pasan a ocupar a alguien: un equipo nuevo, o una cancelada que
// vuelve a programada o realizada.
const overlapsOf = async (resolved: ResolvedBatchVisit[]) => {
  const pending = resolved.filter(
    ({ before, after, patch }) => isBlocking(after.status) && (patch.employeeIds || !isBlocking(before.status))
  );
  const found = await Promise.all(
    pending.map(({ visit, after }) =>
      getAgentVisitOverlaps({
        employeeIds: after.employees.map((employee) => employee.id),
        start: after.scheduledStartAt,
        end: after.scheduledEndAt,
        excludeId: visit.id,
      })
    )
  );
  return new Map(pending.map(({ visit }, index) => [visit.id, found[index]]));
};

// Las empleadas con pagos cargados, con una lectura por mes que se paga.
const paidByMonth = async (resolved: ResolvedBatchVisit[]) => {
  const byMonth = new Map<string, Set<string>>();
  for (const { before, after } of resolved) {
    for (const impact of [visitPayrollImpact(before), visitPayrollImpact(after)]) {
      if (!impact) continue;
      const ids = byMonth.get(impact.paymentMonthKey) ?? new Set<string>();
      impact.employees.forEach((employee) => ids.add(employee.id));
      byMonth.set(impact.paymentMonthKey, ids);
    }
  }
  const months = [...byMonth.entries()];
  const results = await Promise.all(
    months.map(([paymentMonthKey, ids]) => getPaidEmployeeIds({ employeeIds: [...ids], paymentMonthKey }))
  );
  return new Map(months.map(([month], index) => [month, results[index].employeeIds ?? []]));
};

export const createVisitBatchTools = (ctx: AgentToolContext) => ({
  proposeUpdateVisits: tool({
    description:
      "Prepara el mismo cambio en varias visitas (de 2 a 20) con una sola tarjeta, donde el usuario desmarca las que no quiere: no guarda nada. Sirve para marcarlas realizadas (registra el horario programado como real), cancelarlas, marcarlas no realizadas, cambiarles el equipo, las notas o el nombre del cronograma. Antes buscá las visitas con queryOperations. Para mover una visita o registrar un horario real distinto, proposeUpdateVisit.",
    inputSchema: proposeUpdateVisitsInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeUpdateVisits", async () => {
        const ids = [...new Set(input.occurrenceIds)];
        const [visits, employees] = await Promise.all([
          getAgentOccurrencesByIds(ids),
          input.employeeIds ? getAgentVisitEmployees(input.employeeIds) : [],
        ]);
        const live = visits.filter((visit) => !visit.archivedAt);
        const missing = ids.filter((id) => !live.some((visit) => visit.id === id));
        if (missing.length) {
          return toolError("not_found", `No encontré ${missing.join(", ")}. Buscalas con queryOperations (kind visits).`);
        }
        const resolved = resolveUpdateVisits({ visits: live, input, employees });
        if (!resolved.ok) return toolError(resolved.code, resolved.message);

        const [overlaps, paid] = await Promise.all([overlapsOf(resolved.resolved), paidByMonth(resolved.resolved)]);
        const built = buildUpdateVisitsProposal({
          input,
          resolved: resolved.resolved,
          unchanged: resolved.unchanged,
          overlaps,
          payrollWarnings: batchPayrollWarnings(resolved.resolved, paid),
        });
        return saveProposal(ctx, toolCallId, built);
      }),
  }),
});
