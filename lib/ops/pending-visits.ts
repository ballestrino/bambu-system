import { getVisitDayKey, getVisitEmployees, type VisitDayRow } from "@/lib/ops/visit-day";

// Visitas pendientes de registro: programadas, de hoy o de antes (dia de
// Montevideo) y sin horario real completo. Inicio las cuenta y la vista
// Pendientes de Visitas las lista; las dos leen de aca.

export type PendingAge = "today" | "week" | "month" | "old";
export type PendingVisitRow = VisitDayRow & { scheduleRuleId?: string | null };

export const PENDING_AGES: PendingAge[] = ["today", "week", "month", "old"];

export const PENDING_AGE_LABELS: Record<PendingAge, string> = {
  month: "8 a 30 días",
  old: "Más de 30 días",
  today: "Hoy",
  week: "1 a 7 días",
};

const toUtcDay = (dayKey: string) => {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

// Dias enteros entre dos YYYY-MM-DD; sin horas, no le afecta el horario.
export const daysBetweenKeys = (fromKey: string, toKey: string) =>
  Math.round((toUtcDay(toKey) - toUtcDay(fromKey)) / 86_400_000);

type PendingCheckRow = Pick<PendingVisitRow, "actualEndAt" | "actualStartAt" | "scheduledStartAt" | "status">;

export const isPendingRegistration = (visit: PendingCheckRow, todayKey: string) =>
  visit.status === "SCHEDULED" &&
  getVisitDayKey(visit.scheduledStartAt) <= todayKey &&
  (!visit.actualStartAt || !visit.actualEndAt);

export const getPendingAgeDays = (visit: PendingVisitRow, todayKey: string) =>
  Math.max(0, daysBetweenKeys(getVisitDayKey(visit.scheduledStartAt), todayKey));

export const getPendingAge = (days: number): PendingAge =>
  days <= 0 ? "today" : days <= 7 ? "week" : days <= 30 ? "month" : "old";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "1 de agosto".
export const formatDayMonth = (dayKey: string) => {
  const [, month, day] = dayKey.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]}`;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// "Mié 25 nov": la fecha de una fila de Pendientes.
export const formatShortDay = (dayKey: string) => {
  const [year, month, day] = dayKey.split("-").map(Number);
  const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  const monthShort = MONTHS[month - 1] === "septiembre" ? "set" : MONTHS[month - 1].slice(0, 3);
  return `${WEEKDAYS[weekday]} ${day} ${monthShort}`;
};

export const formatPendingAge = (days: number) =>
  days <= 0 ? "Hoy" : days === 1 ? "Hace 1 día" : `Hace ${days} días`;

const byStartDesc = (left: PendingVisitRow, right: PendingVisitRow) =>
  new Date(right.scheduledStartAt).getTime() - new Date(left.scheduledStartAt).getTime();

export const getPendingVisits = <T extends PendingVisitRow>(visits: T[], todayKey: string) =>
  visits.filter((visit) => isPendingRegistration(visit, todayKey)).sort(byStartDesc);

export type PendingJobCount = { count: number; jobId: string; name: string };

export type PendingSummary = {
  ages: Record<PendingAge, number>;
  fromRules: number;
  jobCount: number;
  oldestDayKey: string | null;
  topJobs: PendingJobCount[];
  total: number;
  unassigned: number;
};

export const countPendingByJob = (visits: PendingVisitRow[]) => {
  const counts = new Map<string, PendingJobCount>();
  visits.forEach((visit) => {
    const current = counts.get(visit.jobId) ?? { count: 0, jobId: visit.jobId, name: visit.job.name };
    current.count += 1;
    counts.set(visit.jobId, current);
  });
  return [...counts.values()].sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "es"));
};

// Recibe las ya filtradas por getPendingVisits.
export const summarizePendingVisits = (visits: PendingVisitRow[], todayKey: string): PendingSummary => {
  const ages: Record<PendingAge, number> = { month: 0, old: 0, today: 0, week: 0 };
  let oldestDayKey: string | null = null;

  visits.forEach((visit) => {
    ages[getPendingAge(getPendingAgeDays(visit, todayKey))] += 1;
    const dayKey = getVisitDayKey(visit.scheduledStartAt);
    if (!oldestDayKey || dayKey < oldestDayKey) oldestDayKey = dayKey;
  });

  const jobs = countPendingByJob(visits);

  return {
    ages,
    fromRules: visits.filter((visit) => Boolean(visit.scheduleRuleId)).length,
    jobCount: jobs.length,
    oldestDayKey,
    topJobs: jobs.slice(0, 3),
    total: visits.length,
    unassigned: visits.filter((visit) => !getVisitEmployees(visit).length).length,
  };
};

// Ambar si hay vencidas de dias anteriores, verde suave si solo quedan las de
// hoy y "al dia" sin ninguna.
export type PendingAlertTone = "clear" | "overdue" | "today";

export const getPendingAlertTone = (summary: PendingSummary): PendingAlertTone =>
  summary.total === 0 ? "clear" : summary.total === summary.ages.today ? "today" : "overdue";

// Cuantas de un lote no tienen equipo y de cuantos trabajos son: la barra de
// acciones lo dice y "Registrar como hechas" se apaga si falta equipo.
export const describePendingSelection = (visits: PendingVisitRow[]) => ({
  count: visits.length,
  jobs: new Set(visits.map((visit) => visit.jobId)).size,
  unassigned: visits.filter((visit) => !getVisitEmployees(visit).length).length,
});
