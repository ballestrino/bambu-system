import {
  getPendingAge,
  getPendingAgeDays,
  type PendingAge,
  type PendingVisitRow,
} from "@/lib/ops/pending-visits";
import { getDayKeyWeekday } from "@/lib/ops/visit-calendar";
import { formatVisitRange, getVisitDayKey, getVisitEmployees, getVisitTitle } from "@/lib/ops/visit-day";

// Filtros y grupos de la vista Pendientes: por antiguedad, busqueda y equipo,
// y agrupadas por trabajo con una linea que dice como vienen.

export type PendingTeamFilter = "all" | "none" | (string & {});

export type PendingFilters = {
  age: PendingAge | "all";
  search: string;
  team: PendingTeamFilter;
};

export const DEFAULT_PENDING_FILTERS: PendingFilters = { age: "all", search: "", team: "all" };

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const filterPendingVisits = <T extends PendingVisitRow>(
  visits: T[],
  filters: PendingFilters,
  todayKey: string
) => {
  const search = normalize(filters.search);

  return visits.filter((visit) => {
    if (filters.age !== "all" && getPendingAge(getPendingAgeDays(visit, todayKey)) !== filters.age) return false;
    const employees = getVisitEmployees(visit);
    if (filters.team === "none" && employees.length) return false;
    if (filters.team !== "all" && filters.team !== "none" && !employees.some((employee) => employee.id === filters.team)) {
      return false;
    }
    if (!search) return true;
    return normalize(`${visit.job.name} ${getVisitTitle(visit)}`).includes(search);
  });
};

export type PendingGroup<T extends PendingVisitRow> = {
  jobId: string;
  meta: string;
  name: string;
  visits: T[];
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// "Lun a sáb", "Mar" o "Lun, mié, vie".
export const formatWeekdays = (weekdays: number[]) => {
  const days = [...new Set(weekdays)].sort((left, right) => left - right);
  if (!days.length) return "";
  if (days.length === 7) return "Todos los días";
  const consecutive = days.every((day, index) => index === 0 || day === days[index - 1] + 1);
  const names = days.map((day, index) => (index ? WEEKDAYS[day - 1].toLowerCase() : WEEKDAYS[day - 1]));
  return consecutive && days.length >= 3 ? `${names[0]} a ${names[names.length - 1]}` : names.join(", ");
};

export type PendingWeekday = { ids: string[]; label: string; weekday: number };

// Los dias de la semana en que cae cada visita de un trabajo, de lunes a
// domingo, con sus ids: "todos los miercoles de Godoy" se elige de una vez.
export const getPendingWeekdays = (visits: PendingVisitRow[]): PendingWeekday[] => {
  const days = new Map<number, string[]>();
  visits.forEach((visit) => {
    const weekday = getDayKeyWeekday(getVisitDayKey(visit.scheduledStartAt));
    days.set(weekday, [...(days.get(weekday) ?? []), visit.id]);
  });
  return [...days.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([weekday, ids]) => ({ ids, label: WEEKDAYS[weekday - 1], weekday }));
};

const mostFrequent = (values: string[]) => {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
};

export const describeTeam = (visits: PendingVisitRow[]) => {
  const names = [...new Set(visits.flatMap((visit) => getVisitEmployees(visit).map((employee) => employee.name)))];
  const unassigned = visits.some((visit) => !getVisitEmployees(visit).length);
  if (!names.length) return "sin equipo";
  const team = names.length <= 2 ? names.join(" y ") : `${names.length} empleadas`;
  return unassigned ? `${team} · algunas sin equipo` : team;
};

const describeGroup = (visits: PendingVisitRow[]) =>
  [
    formatWeekdays(visits.map((visit) => getDayKeyWeekday(getVisitDayKey(visit.scheduledStartAt)))),
    mostFrequent(visits.map(formatVisitRange)),
    describeTeam(visits),
  ]
    .filter(Boolean)
    .join(" · ");

// Los trabajos con mas pendientes primero; dentro, la mas reciente arriba.
export const groupPendingByJob = <T extends PendingVisitRow>(visits: T[]): PendingGroup<T>[] => {
  const groups = new Map<string, T[]>();
  visits.forEach((visit) => groups.set(visit.jobId, [...(groups.get(visit.jobId) ?? []), visit]));

  return [...groups.entries()]
    .map(([jobId, items]) => ({
      jobId,
      meta: describeGroup(items),
      name: items[0].job.name,
      visits: [...items].sort(
        (left, right) => new Date(right.scheduledStartAt).getTime() - new Date(left.scheduledStartAt).getTime()
      ),
    }))
    .sort((left, right) => right.visits.length - left.visits.length || left.name.localeCompare(right.name, "es"));
};
