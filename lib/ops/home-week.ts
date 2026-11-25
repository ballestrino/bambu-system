import { rangesOverlap } from "@/lib/ops/minute-ranges";
import {
  getVisitDayKey,
  getVisitEmployees,
  getVisitMinutes,
  getVisitTitle,
  type VisitDayRow,
} from "@/lib/ops/visit-day";

// Lo que Inicio dice de hoy y de la semana: el estado de cada visita en la
// agenda, sin asignar, cruces, horas por empleada y quien no tiene visitas.

export type HomeVisitState = "done" | "ended" | "off" | "ongoing" | "unassigned" | "upcoming";

const ACTIVE_STATUSES = new Set(["DONE", "SCHEDULED"]);

// nowMinute: minutos de Montevideo de ahora; solo cuenta si la visita es de hoy.
export const getHomeVisitState = (
  visit: VisitDayRow,
  { nowMinute, todayKey }: { nowMinute: number | null; todayKey: string }
): HomeVisitState => {
  if (visit.status === "DONE") return "done";
  if (visit.status !== "SCHEDULED") return "off";
  if (!getVisitEmployees(visit).length) return "unassigned";

  const dayKey = getVisitDayKey(visit.scheduledStartAt);
  if (dayKey < todayKey) return "ended";
  if (dayKey > todayKey || nowMinute === null) return "upcoming";

  const { endMinute, startMinute } = getVisitMinutes(visit);
  if (nowMinute >= endMinute) return "ended";
  return nowMinute >= startMinute ? "ongoing" : "upcoming";
};

// Las que piden algo ahora: registrar una que termino o asignar una sin equipo.
export const needsHomeAction = (state: HomeVisitState) => state === "ended" || state === "unassigned";

export type HomeEmployee = { id: string; name: string };

export type HomeEmployeeLoad = HomeEmployee & {
  jobs: string[];
  todayMinutes: number;
  weekMinutes: number;
};

const visitLength = (visit: VisitDayRow) => {
  const { endMinute, startMinute } = getVisitMinutes(visit);
  return Math.max(0, endMinute - startMinute);
};

// Pares de visitas de la misma empleada que se pisan el mismo dia, como el
// aviso de cruces del Cronograma (canceladas y omitidas no ocupan).
export const countWeekOverlaps = (visits: VisitDayRow[]) => {
  const buckets = new Map<string, VisitDayRow[]>();
  visits
    .filter((visit) => ACTIVE_STATUSES.has(visit.status))
    .forEach((visit) => {
      const dayKey = getVisitDayKey(visit.scheduledStartAt);
      getVisitEmployees(visit).forEach((employee) => {
        const key = `${employee.id}:${dayKey}`;
        buckets.set(key, [...(buckets.get(key) ?? []), visit]);
      });
    });

  let pairs = 0;
  buckets.forEach((items) => {
    items.forEach((visit, index) => {
      items.slice(index + 1).forEach((other) => {
        if (rangesOverlap(getVisitMinutes(visit), getVisitMinutes(other))) pairs += 1;
      });
    });
  });
  return pairs;
};

export const summarizeHomeWeek = ({
  employees,
  todayKey,
  visits,
}: {
  employees: HomeEmployee[];
  todayKey: string;
  visits: VisitDayRow[];
}) => {
  const active = visits.filter((visit) => ACTIVE_STATUSES.has(visit.status));
  const loads = new Map<string, HomeEmployeeLoad>(
    employees.map((employee) => [employee.id, { ...employee, jobs: [], todayMinutes: 0, weekMinutes: 0 }])
  );

  active.forEach((visit) => {
    const isToday = getVisitDayKey(visit.scheduledStartAt) === todayKey;
    getVisitEmployees(visit).forEach((employee) => {
      const load = loads.get(employee.id);
      if (!load) return;
      load.weekMinutes += visitLength(visit);
      if (!isToday) return;
      load.todayMinutes += visitLength(visit);
      const title = getVisitTitle(visit);
      if (!load.jobs.includes(title)) load.jobs.push(title);
    });
  });

  const all = [...loads.values()];
  const unassigned = visits.filter(
    (visit) => visit.status === "SCHEDULED" && !getVisitEmployees(visit).length
  );

  return {
    freeToday: all.filter((load) => load.todayMinutes === 0),
    idle: all.filter((load) => load.weekMinutes === 0),
    overlaps: countWeekOverlaps(visits),
    today: all
      .filter((load) => load.todayMinutes > 0)
      .sort((left, right) => right.todayMinutes - left.todayMinutes || left.name.localeCompare(right.name, "es")),
    total: active.length,
    unassigned,
    unassignedToday: unassigned.filter((visit) => getVisitDayKey(visit.scheduledStartAt) === todayKey),
  };
};

export type HomeWeekSummary = ReturnType<typeof summarizeHomeWeek>;
