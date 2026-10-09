import type { OccurrenceStatus } from "@prisma/client";

import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import { toLocalDateKey } from "@/lib/ops/schedule-week";
import { getScheduleDisplayName, type ScheduleOccurrenceRow } from "@/lib/ops/schedule-types";
import { DEFAULT_OPS_TIMEZONE, getLocalDate, getLocalDateTime } from "@/lib/ops/timezone";

// Lo que la pagina de Visitas lee de cada visita. OpsOccurrence lo cumple y
// los checks lo arman a mano.
export type VisitDayRow = ScheduleOccurrenceRow & {
  actualEndAt?: Date | string | null;
  actualStartAt?: Date | string | null;
};

export type VisitDayTotals = {
  attention: number;
  done: number;
  scheduled: number;
  total: number;
};

export type VisitHourGroup<T extends VisitDayRow> = {
  hour: number;
  items: T[];
  label: string;
};

export type VisitDayColumn<T extends VisitDayRow> = {
  employeeId: string | null;
  minutes: number;
  name: string;
  visits: T[];
};

export const UNASSIGNED_COLUMN_NAME = "Sin asignar";

const OFF_STATUSES = new Set<OccurrenceStatus>(["CANCELED", "SKIPPED"]);

export const getVisitEmployees = (visit: ScheduleOccurrenceRow) =>
  visit.employees
    .map(({ employee }) => employee)
    .filter((employee): employee is { id: string; name: string } => Boolean(employee));

// Sin equipo, o cancelada u omitida: alguien tiene que mirarla.
export const isAttentionVisit = (visit: ScheduleOccurrenceRow) =>
  !getVisitEmployees(visit).length || OFF_STATUSES.has(visit.status);

// Con equipo, programada y sin horario real: falta registrarla.
export const isRegistrableVisit = (visit: VisitDayRow) =>
  getVisitEmployees(visit).length > 0 &&
  visit.status === "SCHEDULED" &&
  (!visit.actualStartAt || !visit.actualEndAt);

// Dia y minutos en Montevideo: una visita de las 22:00 es del dia siguiente
// en UTC y no puede saltar de columna segun el navegador.
export const getVisitDayKey = (value: Date | string, timeZone = DEFAULT_OPS_TIMEZONE) =>
  toLocalDateKey(getLocalDate(new Date(value), timeZone));

export const getVisitMinutes = (visit: ScheduleOccurrenceRow, timeZone = DEFAULT_OPS_TIMEZONE) => {
  const start = new Date(visit.scheduledStartAt);
  const end = new Date(visit.scheduledEndAt);
  const local = getLocalDateTime(start, timeZone);
  const startMinute = local.hour * 60 + local.minute;
  const duration = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

  return { endMinute: startMinute + duration, startMinute };
};

export const formatVisitRange = (visit: ScheduleOccurrenceRow) => {
  const { endMinute, startMinute } = getVisitMinutes(visit);
  return `${formatMinuteOfDay(startMinute)} – ${formatMinuteOfDay(endMinute)}`;
};

export const formatActualRange = (visit: VisitDayRow) => {
  if (!visit.actualStartAt || !visit.actualEndAt) return null;
  const start = getVisitMinutes({ ...visit, scheduledEndAt: visit.actualEndAt, scheduledStartAt: visit.actualStartAt });
  return `${formatMinuteOfDay(start.startMinute)} – ${formatMinuteOfDay(start.endMinute)}`;
};

export const getVisitTitle = getScheduleDisplayName;

export const getVisitAddress = (visit: ScheduleOccurrenceRow) =>
  visit.job.serviceAddress?.trim() || visit.job.serviceLocation?.trim() || null;

export const getVisitMinutesLength = (visits: ScheduleOccurrenceRow[]) =>
  visits.reduce((total, visit) => {
    const { endMinute, startMinute } = getVisitMinutes(visit);
    return total + endMinute - startMinute;
  }, 0);

// "3,5 h": las horas del dia o de la semana de una empleada.
export const formatHours = (minutes: number) =>
  `${String(Math.round((minutes / 60) * 10) / 10).replace(".", ",")} h`;

export const plural = (count: number, word: string, pluralWord = `${word}s`) =>
  `${count} ${count === 1 ? word : pluralWord}`;

const byStart = (left: ScheduleOccurrenceRow, right: ScheduleOccurrenceRow) =>
  new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime();

export const sortVisits = <T extends ScheduleOccurrenceRow>(visits: T[]) =>
  [...visits].sort(byStart);

export const getVisitsOfDay = <T extends ScheduleOccurrenceRow>(visits: T[], dayKey: string) =>
  sortVisits(visits.filter((visit) => getVisitDayKey(visit.scheduledStartAt) === dayKey));

// Totales por dia para la tira semanal y los puntos del mini mes.
export const summarizeVisitDays = (visits: ScheduleOccurrenceRow[]) => {
  const totals = new Map<string, VisitDayTotals>();

  visits.forEach((visit) => {
    const key = getVisitDayKey(visit.scheduledStartAt);
    const current = totals.get(key) ?? { attention: 0, done: 0, scheduled: 0, total: 0 };
    current.total += 1;
    if (isAttentionVisit(visit)) current.attention += 1;
    if (visit.status === "DONE") current.done += 1;
    if (visit.status === "SCHEDULED") current.scheduled += 1;
    totals.set(key, current);
  });

  return totals;
};

export const groupVisitsByHour = <T extends ScheduleOccurrenceRow>(visits: T[]) => {
  const groups = new Map<number, VisitHourGroup<T>>();

  sortVisits(visits).forEach((visit) => {
    const hour = Math.floor(getVisitMinutes(visit).startMinute / 60);
    const group = groups.get(hour);
    if (group) {
      group.items.push(visit);
    } else {
      groups.set(hour, { hour, items: [visit], label: formatMinuteOfDay(hour * 60) });
    }
  });

  return [...groups.values()].sort((left, right) => left.hour - right.hour);
};

// "Sin asignar" primero, despues el equipo en el orden recibido. Una empleada
// que ya no esta activa pero tiene visitas ese dia igual aparece.
export const buildDayColumns = <T extends ScheduleOccurrenceRow>(
  visits: T[],
  employees: { id: string; name: string }[]
): VisitDayColumn<T>[] => {
  const known = new Map(employees.map((employee) => [employee.id, employee.name]));
  visits.forEach((visit) =>
    getVisitEmployees(visit).forEach((employee) => {
      if (!known.has(employee.id)) known.set(employee.id, employee.name);
    })
  );

  const column = (employeeId: string | null, name: string): VisitDayColumn<T> => {
    const own = sortVisits(
      visits.filter((visit) => {
        const ids = getVisitEmployees(visit).map((employee) => employee.id);
        return employeeId ? ids.includes(employeeId) : !ids.length;
      })
    );
    return { employeeId, minutes: getVisitMinutesLength(own), name, visits: own };
  };

  return [
    column(null, UNASSIGNED_COLUMN_NAME),
    ...[...known].map(([id, name]) => column(id, name)),
  ];
};

export const TIME_GRID_START_HOUR = 7;
export const TIME_GRID_END_HOUR = 20;

// Posicion de un bloque en la grilla horaria; lo que cae fuera de 07-20 se
// recorta al borde para que siga visible.
export const getTimeGridBox = (
  range: { endMinute: number; startMinute: number },
  hourPx: number
) => {
  const first = TIME_GRID_START_HOUR * 60;
  const last = TIME_GRID_END_HOUR * 60;
  const start = Math.min(Math.max(range.startMinute, first), last - 30);
  const end = Math.max(Math.min(range.endMinute, last), start + 30);

  return {
    height: ((end - start) / 60) * hourPx - 4,
    top: ((start - first) / 60) * hourPx + 2,
  };
};

export const getNowLineTop = (now: Date, hourPx: number, timeZone = DEFAULT_OPS_TIMEZONE) => {
  const local = getLocalDateTime(now, timeZone);
  const minute = local.hour * 60 + local.minute;
  if (minute < TIME_GRID_START_HOUR * 60 || minute > TIME_GRID_END_HOUR * 60) return null;
  return ((minute - TIME_GRID_START_HOUR * 60) / 60) * hourPx;
};
