import type { JobStatus } from "@prisma/client";

import type { ProposalChange, ProposalSummary } from "@/lib/agent/proposals";
import { jobStatusLabel, teamLabel } from "@/lib/agent/visit-format";
import { MAX_PROPOSED_VISITS } from "@/lib/agent/visit-proposals";
import { expandVisitDates, formatLocalDate, formatVisitRange, parseLocalDateTime } from "@/lib/agent/visit-time";
import type { VisitEmployee } from "@/lib/agent/visit-update-builder";
import { capWarnings, overlapWarnings, type VisitOverlap } from "@/lib/agent/visit-warnings";
import { resolveEmployeeIds, type AssignmentWindow } from "@/lib/ops/occurrence-replacement";
import type { CreateVisitsPayload } from "@/schemas/agent-visit-proposals";
import type { ProposeCreateVisitsInput } from "@/schemas/agent-visit-tools";

// Arma la propuesta de crear un lote de visitas de un trabajo. Puro: la tool
// hace las lecturas y guarda; confirmar ejecuta createJobOccurrences.
export type VisitJob = {
  id: string;
  name: string;
  status: JobStatus;
  archivedAt: Date | null;
  assignments: AssignmentWindow[];
};

export type VisitSlot = { start: Date; end: Date };

type Refusal = { ok: false; code: string; message: string };

const refuse = (code: string, message: string): Refusal => ({ ok: false, code, message });

const sameTeam = (left: string[], right: string[]) => [...left].sort().join() === [...right].sort().join();

// Los horarios del lote y su equipo, antes de leer las empleadas. Sin
// employeeIds el equipo sale de las asignaciones del trabajo, como al generar;
// si cambia dentro del rango, se pide el equipo explícito.
export const resolveCreateVisits = (
  job: VisitJob,
  input: ProposeCreateVisitsInput
): { ok: true; slots: VisitSlot[]; teamIds: string[] } | Refusal => {
  if (job.archivedAt || job.status === "ARCHIVED") {
    return refuse("archived_job", `${job.name} está archivado: no se le pueden agendar visitas.`);
  }
  const expanded = expandVisitDates(input);
  if (!expanded.ok) return expanded;
  if (!expanded.dates.length) {
    return refuse("no_dates", "Ningún día del rango cae en esos días de la semana: no hay visitas para proponer.");
  }
  if (expanded.dates.length > MAX_PROPOSED_VISITS) {
    return refuse(
      "too_many",
      `Son ${expanded.dates.length} visitas y el máximo por propuesta es ${MAX_PROPOSED_VISITS}: partilo en tandas (por ejemplo, por mes).`
    );
  }

  const slots: VisitSlot[] = [];
  for (const date of expanded.dates.map(formatLocalDate)) {
    const start = parseLocalDateTime(`${date} ${input.startTime}`);
    const end = parseLocalDateTime(`${date} ${input.endTime}`);
    if (!start || !end) return refuse("invalid_time", "startTime y endTime van como HH:mm, de 00:00 a 23:59.");
    if (end.getTime() <= start.getTime()) {
      return refuse("invalid_time", "endTime tiene que ser posterior a startTime: una visita que cruza la medianoche se agenda en la pantalla.");
    }
    slots.push({ start, end });
  }

  if (input.employeeIds) return { ok: true, slots, teamIds: [...new Set(input.employeeIds)] };
  const teams = slots.map((slot) => resolveEmployeeIds(job.assignments, slot.start));
  if (teams.some((team) => !sameTeam(team, teams[0]))) {
    return refuse("team_changes", "El equipo asignado al trabajo cambia dentro de esas fechas: pasá employeeIds o partí el pedido.");
  }
  return { ok: true, slots, teamIds: teams[0] };
};

const text = (value: string | null) => value?.trim() || null;

const overlapsOf = (slot: VisitSlot, visits: VisitOverlap[]) =>
  visits.filter((visit) => visit.start.getTime() < slot.end.getTime() && visit.end.getTime() > slot.start.getTime());

export const buildCreateVisitsProposal = ({
  job,
  input,
  slots,
  teamIds,
  employees,
  takenStarts,
  teamVisits,
  now,
}: {
  job: VisitJob;
  input: ProposeCreateVisitsInput;
  slots: VisitSlot[];
  teamIds: string[];
  employees: VisitEmployee[];
  takenStarts: Date[];
  teamVisits: VisitOverlap[];
  now: Date;
}) => {
  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  const missing = teamIds.find((id) => !byId.has(id));
  if (missing) return refuse("not_found", `No encontré la empleada ${missing}: buscala con queryOperations (kind employees).`);
  const team = teamIds.map((id) => byId.get(id)!);
  const archived = team.find((employee) => employee.archivedAt);
  if (archived) return refuse("archived_employee", `${archived.name} está archivada: no se le pueden asignar visitas.`);

  const taken = new Set(takenStarts.map((start) => start.getTime()));
  const repeated = slots.filter((slot) => taken.has(slot.start.getTime()));
  if (repeated.length) {
    const days = repeated.map((slot) => formatVisitRange(slot.start, slot.end).split("–")[0]).join(", ");
    return refuse("already_scheduled", `${job.name} ya tiene visitas que empiezan ${days}: sacá esos días (con dates) o cambiá el horario.`);
  }

  const overlaps = slots.flatMap((slot) => overlapsOf(slot, teamVisits));
  const past = slots.filter((slot) => slot.start.getTime() < now.getTime()).length;
  const warnings = capWarnings([
    ...(job.status !== "ACTIVE" ? [`El trabajo está ${jobStatusLabel(job.status).toLowerCase()}.`] : []),
    ...(team.length ? [] : ["Sin equipo: las visitas quedan sin empleadas asignadas."]),
    ...team.filter((employee) => !employee.isActive).map((employee) => `${employee.name} está inactiva.`),
    ...new Set(overlapWarnings(overlaps)),
    ...(past === 1 ? ["Una visita ya pasó y queda programada."] : past > 1 ? [`${past} visitas ya pasaron y quedan programadas.`] : []),
  ]);

  const notes = text(input.notes);
  const scheduleLabel = text(input.scheduleLabel);
  const changes: ProposalChange[] = [
    { field: "team", label: "Equipo", before: null, after: teamLabel(team) },
    ...(notes ? [{ field: "notes", label: "Notas", before: null, after: notes }] : []),
    ...(scheduleLabel ? [{ field: "scheduleLabel", label: "Nombre en el cronograma", before: null, after: scheduleLabel }] : []),
  ];
  const summary: ProposalSummary = {
    title: slots.length === 1 ? `Agendar una visita de ${job.name}` : `Agendar ${slots.length} visitas de ${job.name}`,
    name: job.name,
    slug: null,
    changes,
    inputs: null,
    before: null,
    after: null,
    stored: [],
    warnings,
    items: slots.map((slot) => {
      const crossed = [...new Set(overlapsOf(slot, teamVisits).map((visit) => visit.job))];
      return { label: formatVisitRange(slot.start, slot.end), detail: crossed.length ? `Se cruza con ${crossed.join(", ")}` : null };
    }),
  };
  const payload: CreateVisitsPayload = {
    jobId: job.id,
    employeeIds: teamIds,
    notes,
    scheduleLabel,
    visits: slots.map((slot) => ({ scheduledStartAt: slot.start.toISOString(), scheduledEndAt: slot.end.toISOString() })),
  };
  return { ok: true as const, kind: "CREATE_VISITS" as const, payload, summary };
};
