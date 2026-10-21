import type { OpsOccurrence } from "@/components/ops/types";
import type { ProposalChange, ProposalSummary } from "@/lib/agent/proposals";
import {
  describeVisit,
  describeVisitChanges,
  jobStatusLabel,
  toVisitState,
  type VisitState,
} from "@/lib/agent/visit-format";
import { parseLocalDateTime } from "@/lib/agent/visit-time";
import type { ProposeUpdateVisitInput } from "@/schemas/agent-visit-tools";
import type { VisitPatch } from "@/schemas/agent-visit-proposals";

// Arma las propuestas de cambiar o eliminar una visita. Puro: la tool hace
// las lecturas y guarda; confirmar ejecuta updateJobOccurrence o
// archiveJobOccurrence con el payload.
export type VisitEmployee = { id: string; name: string; isActive: boolean; archivedAt: Date | null };

type Refusal = { ok: false; code: string; message: string };

const refuse = (code: string, message: string): Refusal => ({ ok: false, code, message });

export type ResolvedVisitUpdate = {
  ok: true;
  before: VisitState;
  after: VisitState;
  patch: VisitPatch;
  notices: string[];
};

const ms = (date: Date | null) => date?.getTime() ?? null;
const iso = (date: Date | null) => date?.toISOString() ?? null;
const ids = (state: VisitState) => state.employees.map((employee) => employee.id).sort().join();

// Solo las claves que cambian: updateJobOccurrence deja el resto como está.
export const buildVisitPatch = (before: VisitState, after: VisitState): VisitPatch => ({
  ...(ms(before.scheduledStartAt) !== ms(after.scheduledStartAt) && { scheduledStartAt: after.scheduledStartAt.toISOString() }),
  ...(ms(before.scheduledEndAt) !== ms(after.scheduledEndAt) && { scheduledEndAt: after.scheduledEndAt.toISOString() }),
  ...(ids(before) !== ids(after) && { employeeIds: after.employees.map((employee) => employee.id) }),
  ...(before.status !== after.status && { status: after.status }),
  ...(ms(before.actualStartAt) !== ms(after.actualStartAt) && { actualStartAt: iso(after.actualStartAt) }),
  ...(ms(before.actualEndAt) !== ms(after.actualEndAt) && { actualEndAt: iso(after.actualEndAt) }),
  ...(before.notes !== after.notes && { notes: after.notes }),
  ...(before.scheduleLabel !== after.scheduleLabel && { scheduleLabel: after.scheduleLabel }),
});

const LABELS = { start: "start", end: "end", actualStart: "actualStart", actualEnd: "actualEnd" } as const;

const resolveTeam = (before: VisitState, requested: string[], employees: VisitEmployee[]) => {
  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  const current = new Set(before.employees.map((employee) => employee.id));
  const unique = [...new Set(requested)];
  const missing = unique.find((id) => !byId.has(id));
  if (missing) return refuse("not_found", `No encontré la empleada ${missing}: buscala con queryOperations (kind employees).`);
  const added = unique.map((id) => byId.get(id)!).filter((employee) => !current.has(employee.id));
  const archived = added.find((employee) => employee.archivedAt);
  if (archived) return refuse("archived_employee", `${archived.name} está archivada: no se le pueden asignar visitas.`);
  return {
    ok: true as const,
    team: unique.map((id) => ({ id, name: byId.get(id)!.name })),
    notices: added.filter((employee) => !employee.isActive).map((employee) => `${employee.name} está inactiva.`),
  };
};

// Igual que registrar desde la pantalla: una realizada sin horario real toma
// el programado, y una que deja de estar realizada pierde el horario real.
export const resolveVisitUpdate = ({
  visit,
  input,
  employees,
}: {
  visit: OpsOccurrence;
  input: ProposeUpdateVisitInput;
  employees: VisitEmployee[];
}): ResolvedVisitUpdate | Refusal => {
  const before = toVisitState(visit);
  const times: Record<keyof typeof LABELS, Date | null> = { start: null, end: null, actualStart: null, actualEnd: null };
  for (const key of Object.keys(LABELS) as (keyof typeof LABELS)[]) {
    const value = input[key];
    if (value === null) continue;
    times[key] = parseLocalDateTime(value);
    if (!times[key]) return refuse("invalid_time", `${key} no es una fecha y hora válida: usá AAAA-MM-DD HH:mm.`);
  }

  const start = times.start ?? before.scheduledStartAt;
  const keptEnd = new Date(start.getTime() + before.scheduledEndAt.getTime() - before.scheduledStartAt.getTime());
  const end = times.end ?? (times.start ? keptEnd : before.scheduledEndAt);
  if (end.getTime() <= start.getTime()) return refuse("invalid_time", "El fin programado tiene que ser posterior al inicio.");

  const team = input.employeeIds ? resolveTeam(before, input.employeeIds, employees) : null;
  if (team && !team.ok) return team;
  const notices = [...(team?.notices ?? [])];
  if (visit.job.status !== "ACTIVE") notices.push(`El trabajo está ${jobStatusLabel(visit.job.status).toLowerCase()}.`);

  const hasActual = Boolean(times.actualStart || times.actualEnd);
  if (hasActual && input.status && input.status !== "DONE") {
    return refuse("invalid_values", "El horario real solo va en una visita realizada (status DONE).");
  }
  let status = input.status ?? before.status;
  if (hasActual && status !== "DONE") {
    status = "DONE";
    notices.push("Registrar el horario real la marca como realizada.");
  }
  const duration = end.getTime() - start.getTime();
  let actualStart = times.actualStart ?? before.actualStartAt;
  let actualEnd = times.actualEnd ?? before.actualEndAt;
  if (times.actualStart && !actualEnd) actualEnd = new Date(times.actualStart.getTime() + duration);
  if (times.actualEnd && !actualStart) actualStart = new Date(times.actualEnd.getTime() - duration);
  if (status === "DONE" && before.status !== "DONE" && (!actualStart || !actualEnd)) {
    actualStart = start;
    actualEnd = end;
    notices.push("Sin horario real: se registra el programado.");
  }
  if (status !== "DONE" && before.status === "DONE") {
    actualStart = null;
    actualEnd = null;
  }
  if (actualStart && actualEnd && actualEnd.getTime() < actualStart.getTime()) {
    return refuse("invalid_time", "El fin real no puede ser anterior al inicio real.");
  }

  const text = (value: string | null, current: string | null) => (value === null ? current : value.trim() || null);
  const after: VisitState = {
    scheduledStartAt: start,
    scheduledEndAt: end,
    actualStartAt: actualStart,
    actualEndAt: actualEnd,
    status,
    employees: team?.team ?? before.employees,
    notes: text(input.notes, before.notes),
    scheduleLabel: text(input.scheduleLabel, before.scheduleLabel),
  };
  const patch = buildVisitPatch(before, after);
  if (!Object.keys(patch).length) return refuse("no_changes", "La visita ya está así: no hay nada que cambiar.");
  return { ok: true, before, after, patch, notices };
};

const visitSummary = (title: string, name: string, changes: ProposalChange[], warnings: string[]): ProposalSummary => ({
  title,
  name,
  slug: null,
  changes,
  inputs: null,
  before: null,
  after: null,
  stored: [],
  warnings,
});

// El equipo guardado de la visita (no solo las empleadas que se leen): si
// cambia antes de confirmar, la propuesta queda vieja.
const baseOf = (visit: OpsOccurrence) => ({
  occurrenceId: visit.id,
  baseUpdatedAt: new Date(visit.updatedAt).toISOString(),
});

export const buildUpdateVisitProposal = (visit: OpsOccurrence, resolved: ResolvedVisitUpdate, warnings: string[]) => ({
  ok: true as const,
  kind: "UPDATE_VISIT" as const,
  payload: {
    ...baseOf(visit),
    baseEmployeeIds: visit.employees.map((assignment) => assignment.employeeId),
    patch: resolved.patch,
  },
  summary: visitSummary(
    `Cambiar la visita de ${visit.job.name}`,
    visit.job.name,
    describeVisitChanges(resolved.before, resolved.after),
    warnings
  ),
});

export const buildArchiveVisitProposal = (visit: OpsOccurrence, warnings: string[]) => ({
  ok: true as const,
  kind: "ARCHIVE_VISIT" as const,
  payload: baseOf(visit),
  summary: visitSummary(
    `Eliminar la visita de ${visit.job.name}`,
    visit.job.name,
    [{ field: "visit", label: "Visita", before: describeVisit(toVisitState(visit)), after: "Eliminada" }],
    warnings
  ),
});
