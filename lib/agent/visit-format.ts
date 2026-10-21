import type { OccurrenceStatus } from "@prisma/client";

import { opsJobStatus, opsOccurrenceStatus } from "@/components/ops/shared/ops-theme";
import type { OpsOccurrence } from "@/components/ops/types";
import type { ProposalChange } from "@/lib/agent/proposals";
import { formatLocalDateTime, formatVisitRange } from "@/lib/agent/visit-time";

// Cómo el agente ve y describe una visita. Puro.
export type VisitState = {
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  status: OccurrenceStatus;
  employees: { id: string; name: string }[];
  notes: string | null;
  scheduleLabel: string | null;
};

const NOTES_PREVIEW = 120;

export const visitStatusLabel = (status: OccurrenceStatus) => opsOccurrenceStatus[status].label;

export const jobStatusLabel = (status: keyof typeof opsJobStatus) => opsJobStatus[status].label;

const employeesOf = (visit: OpsOccurrence) =>
  visit.employees.flatMap(({ employee }) => (employee ? [{ id: employee.id, name: employee.name }] : []));

export const toVisitState = (visit: OpsOccurrence): VisitState => ({
  scheduledStartAt: new Date(visit.scheduledStartAt),
  scheduledEndAt: new Date(visit.scheduledEndAt),
  actualStartAt: visit.actualStartAt ? new Date(visit.actualStartAt) : null,
  actualEndAt: visit.actualEndAt ? new Date(visit.actualEndAt) : null,
  status: visit.status,
  employees: employeesOf(visit),
  notes: visit.notes ?? null,
  scheduleLabel: visit.scheduleLabel ?? null,
});

const localOrNull = (date: Date | null) => (date ? formatLocalDateTime(new Date(date)) : null);

// Una fila de queryOperations: lo que el agente necesita para encontrar una
// visita y proponer cambiarla. when trae el día de la semana: el modelo lo
// calculaba mal.
export const toAgentVisitRow = (visit: OpsOccurrence) => ({
  id: visit.id,
  jobId: visit.jobId,
  job: visit.job.name,
  when: formatVisitRange(new Date(visit.scheduledStartAt), new Date(visit.scheduledEndAt)),
  status: visit.status,
  scheduledStart: formatLocalDateTime(new Date(visit.scheduledStartAt)),
  scheduledEnd: formatLocalDateTime(new Date(visit.scheduledEndAt)),
  actualStart: localOrNull(visit.actualStartAt),
  actualEnd: localOrNull(visit.actualEndAt),
  employees: employeesOf(visit).map((employee) => employee.name),
  employeeIds: employeesOf(visit).map((employee) => employee.id),
  scheduleLabel: visit.scheduleLabel,
  notes:
    visit.notes && visit.notes.length > NOTES_PREVIEW ? `${visit.notes.slice(0, NOTES_PREVIEW - 1)}…` : visit.notes,
  fromRule: Boolean(visit.scheduleRuleId),
});

export const teamLabel = (employees: { name: string }[]) =>
  employees.length ? employees.map((employee) => employee.name).join(", ") : "Sin equipo";

const actualLabel = (state: VisitState) =>
  state.actualStartAt && state.actualEndAt ? formatVisitRange(state.actualStartAt, state.actualEndAt) : null;

export const describeVisit = (state: VisitState) =>
  `${formatVisitRange(state.scheduledStartAt, state.scheduledEndAt)} · ${teamLabel(state.employees)} · ${visitStatusLabel(state.status)}`;

const sameIds = (left: { id: string }[], right: { id: string }[]) =>
  left.map((item) => item.id).sort().join() === right.map((item) => item.id).sort().join();

// Qué cambia en la tarjeta, ya en hora de Montevideo.
export const describeVisitChanges = (before: VisitState, after: VisitState): ProposalChange[] => {
  const rows: (ProposalChange | null)[] = [
    formatVisitRange(before.scheduledStartAt, before.scheduledEndAt) ===
    formatVisitRange(after.scheduledStartAt, after.scheduledEndAt)
      ? null
      : {
          field: "schedule",
          label: "Horario",
          before: formatVisitRange(before.scheduledStartAt, before.scheduledEndAt),
          after: formatVisitRange(after.scheduledStartAt, after.scheduledEndAt),
        },
    sameIds(before.employees, after.employees)
      ? null
      : { field: "team", label: "Equipo", before: teamLabel(before.employees), after: teamLabel(after.employees) },
    before.status === after.status
      ? null
      : { field: "status", label: "Estado", before: visitStatusLabel(before.status), after: visitStatusLabel(after.status) },
    actualLabel(before) === actualLabel(after)
      ? null
      : { field: "actual", label: "Horario real", before: actualLabel(before), after: actualLabel(after) },
    before.notes === after.notes ? null : { field: "notes", label: "Notas", before: before.notes, after: after.notes },
    before.scheduleLabel === after.scheduleLabel
      ? null
      : { field: "scheduleLabel", label: "Nombre en el cronograma", before: before.scheduleLabel, after: after.scheduleLabel },
  ];
  return rows.filter((row): row is ProposalChange => row !== null);
};
