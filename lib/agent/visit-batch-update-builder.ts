import type { OccurrenceStatus } from "@prisma/client";

import type { OpsOccurrence } from "@/components/ops/types";
import type { ProposalChange, ProposalSummary } from "@/lib/agent/proposals";
import { teamLabel, visitStatusLabel } from "@/lib/agent/visit-format";
import { formatVisitRange } from "@/lib/agent/visit-time";
import {
  resolveVisitUpdate,
  type ResolvedVisitUpdate,
  type VisitEmployee,
} from "@/lib/agent/visit-update-builder";
import { capWarnings, overlapWarnings, type VisitOverlap } from "@/lib/agent/visit-warnings";
import type { UpdateVisitsPayload } from "@/schemas/agent-visit-proposals";
import type { ProposeUpdateVisitsInput } from "@/schemas/agent-visit-tools";

// Arma la propuesta de hacer el mismo cambio en varias visitas, con una
// tarjeta y una casilla por visita. Cada visita se resuelve con las reglas de
// cambiar una (resolveVisitUpdate). Puro: la tool hace las lecturas.
type Refusal = { ok: false; code: string; message: string };

export type ResolvedBatchVisit = ResolvedVisitUpdate & { visit: OpsOccurrence };

const STATUS_PLURAL: Record<OccurrenceStatus, string> = {
  SCHEDULED: "programadas",
  DONE: "realizadas",
  SKIPPED: "no realizadas",
  CANCELED: "canceladas",
};

// Las que ya están así quedan fuera; con una sola que no se puede cambiar, se
// rechaza el pedido entero con su motivo.
export const resolveUpdateVisits = ({
  visits,
  input,
  employees,
}: {
  visits: OpsOccurrence[];
  input: ProposeUpdateVisitsInput;
  employees: VisitEmployee[];
}): { ok: true; resolved: ResolvedBatchVisit[]; unchanged: OpsOccurrence[] } | Refusal => {
  const resolved: ResolvedBatchVisit[] = [];
  const unchanged: OpsOccurrence[] = [];
  const sorted = [...visits].sort((left, right) => +new Date(left.scheduledStartAt) - +new Date(right.scheduledStartAt));
  for (const visit of sorted) {
    const result = resolveVisitUpdate({
      visit,
      input: { ...input, occurrenceId: visit.id, start: null, end: null, actualStart: null, actualEnd: null },
      employees,
    });
    if (result.ok) resolved.push({ ...result, visit });
    else if (result.code === "no_changes") unchanged.push(visit);
    else return { ...result, message: `${visit.job.name} (${formatVisitRange(new Date(visit.scheduledStartAt), new Date(visit.scheduledEndAt))}): ${result.message}` };
  }
  if (!resolved.length) return { ok: false, code: "no_changes", message: "Las visitas ya están así: no hay nada que cambiar." };
  return { ok: true, resolved, unchanged };
};

// El valor de antes si todas lo comparten; si no, "Varios".
const common = (values: (string | null)[]) => (new Set(values).size === 1 ? values[0] : "Varios");

const describeBatchChanges = (input: ProposeUpdateVisitsInput, resolved: ResolvedBatchVisit[]): ProposalChange[] => {
  const after = resolved[0].after;
  const rows: (ProposalChange | false)[] = [
    input.status !== null && {
      field: "status",
      label: "Estado",
      before: common(resolved.map((item) => visitStatusLabel(item.before.status))),
      after: visitStatusLabel(after.status),
    },
    input.employeeIds !== null && {
      field: "team",
      label: "Equipo",
      before: common(resolved.map((item) => teamLabel(item.before.employees))),
      after: teamLabel(after.employees),
    },
    input.notes !== null && { field: "notes", label: "Notas", before: common(resolved.map((item) => item.before.notes)), after: after.notes },
    input.scheduleLabel !== null && {
      field: "scheduleLabel",
      label: "Nombre en el cronograma",
      before: common(resolved.map((item) => item.before.scheduleLabel)),
      after: after.scheduleLabel,
    },
  ];
  return rows.filter((row): row is ProposalChange => Boolean(row));
};

const titleOf = (input: ProposeUpdateVisitsInput, count: number) =>
  input.status && input.employeeIds === null && input.notes === null && input.scheduleLabel === null
    ? `Marcar ${count} visitas como ${STATUS_PLURAL[input.status]}`
    : `Cambiar ${count} visitas`;

export const buildUpdateVisitsProposal = ({
  input,
  resolved,
  unchanged,
  overlaps,
  payrollWarnings,
}: {
  input: ProposeUpdateVisitsInput;
  resolved: ResolvedBatchVisit[];
  unchanged: OpsOccurrence[];
  // Los cruces de cada visita, por id (solo las que pasan a ocupar al equipo).
  overlaps: Map<string, VisitOverlap[]>;
  payrollWarnings: string[];
}) => {
  const skipped = unchanged.length;
  const warnings = capWarnings([
    ...payrollWarnings,
    ...new Set(resolved.flatMap((item) => item.notices)),
    ...new Set(resolved.flatMap((item) => overlapWarnings(overlaps.get(item.visit.id) ?? []))),
    ...(skipped ? [`${skipped === 1 ? "1 visita ya estaba así y queda" : `${skipped} visitas ya estaban así y quedan`} fuera.`] : []),
  ]);
  const summary: ProposalSummary = {
    title: titleOf(input, resolved.length),
    name: [...new Set(resolved.map((item) => item.visit.job.name))].join(", "),
    slug: null,
    changes: describeBatchChanges(input, resolved),
    inputs: null,
    before: null,
    after: null,
    stored: [],
    warnings,
    items: resolved.map(({ visit, before }) => {
      const crossed = [...new Set((overlaps.get(visit.id) ?? []).map((overlap) => overlap.job))];
      return {
        label: `${visit.job.name} · ${formatVisitRange(before.scheduledStartAt, before.scheduledEndAt)}`,
        detail: crossed.length ? `Se cruza con ${crossed.join(", ")}` : null,
      };
    }),
  };
  const payload: UpdateVisitsPayload = {
    visits: resolved.map(({ visit, patch }) => ({
      occurrenceId: visit.id,
      baseUpdatedAt: new Date(visit.updatedAt).toISOString(),
      baseEmployeeIds: visit.employees.map((assignment) => assignment.employeeId),
      patch,
    })),
  };
  return { ok: true as const, kind: "UPDATE_VISITS" as const, payload, summary };
};
