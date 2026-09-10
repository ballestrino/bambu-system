import {
  formatScheduleDayMonth,
  formatScheduleGeneratedAt,
  formatScheduleLongDay,
  formatScheduleTime,
  formatScheduleWeekday,
  formatScheduleWeekLabel,
} from "@/lib/ops/schedule-format";
import { toLocalDateKey, type ScheduleWeek } from "@/lib/ops/schedule-week";
import {
  getScheduleDisplayName,
  type ScheduleDay,
  type ScheduleEmployee,
  type ScheduleOccurrenceRow,
  type ScheduleVisit,
  type WeeklySchedule,
} from "@/lib/ops/schedule-types";
import {
  addLocalDays,
  DEFAULT_OPS_TIMEZONE,
  diffLocalDays,
  getIsoWeekday,
  getLocalDate,
} from "@/lib/ops/timezone";

const DELIVERED_STATUSES = new Set(["SCHEDULED", "DONE"]);

const buildEmptyDays = (week: ScheduleWeek): ScheduleDay[] =>
  week.dates.map((date, index) => {
    const localDate = addLocalDays(week.startLocal, index);

    return {
      dateKey: toLocalDateKey(localDate),
      dayLabel: formatScheduleDayMonth(date),
      longLabel: formatScheduleLongDay(date),
      visits: [],
      weekdayLabel: formatScheduleWeekday(date),
      weekdayNumber: getIsoWeekday(localDate),
    };
  });

// El indice de dia se calcula en hora local: una visita de las 22:00 en
// Montevideo es del dia siguiente en UTC y caeria en la columna equivocada.
const getDayIndex = (
  occurrence: ScheduleOccurrenceRow,
  week: ScheduleWeek,
  timeZone: string
) =>
  diffLocalDays(
    getLocalDate(new Date(occurrence.scheduledStartAt), timeZone),
    week.startLocal
  );

const toVisit = (
  occurrence: ScheduleOccurrenceRow,
  employeeId: string | null
): ScheduleVisit => ({
  address:
    occurrence.job.serviceAddress?.trim() ||
    occurrence.job.serviceLocation?.trim() ||
    "Sin dirección registrada",
  displayName: getScheduleDisplayName(occurrence),
  endLabel: formatScheduleTime(new Date(occurrence.scheduledEndAt)),
  id: occurrence.id,
  jobId: occurrence.jobId,
  jobName: occurrence.job.name,
  startAt: new Date(occurrence.scheduledStartAt).toISOString(),
  startLabel: formatScheduleTime(new Date(occurrence.scheduledStartAt)),
  status: occurrence.status,
  teammates: occurrence.employees
    .map((assignment) => assignment.employee)
    .filter(
      (employee): employee is { id: string; name: string } =>
        Boolean(employee) && employee!.id !== employeeId
    )
    .map((employee) => employee.name)
    .sort((left, right) => left.localeCompare(right, "es")),
});

export const buildWeeklySchedule = (input: {
  employees: { id: string; name: string }[];
  generatedAt: Date;
  occurrences: ScheduleOccurrenceRow[];
  timeZone?: string;
  week: ScheduleWeek;
}): WeeklySchedule => {
  const timeZone = input.timeZone ?? DEFAULT_OPS_TIMEZONE;
  const buckets = new Map<string, ScheduleDay[]>(
    input.employees.map((employee) => [employee.id, buildEmptyDays(input.week)])
  );
  const unassigned = buildEmptyDays(input.week);

  input.occurrences.forEach((occurrence) => {
    const dayIndex = getDayIndex(occurrence, input.week, timeZone);
    if (dayIndex < 0 || dayIndex > 6) {
      return;
    }

    const assigned = occurrence.employees
      .map((assignment) => assignment.employee)
      .filter((employee): employee is { id: string; name: string } => Boolean(employee));

    if (!assigned.length) {
      unassigned[dayIndex].visits.push(toVisit(occurrence, null));
      return;
    }

    assigned.forEach((employee) => {
      buckets.get(employee.id)?.[dayIndex].visits.push(toVisit(occurrence, employee.id));
    });
  });

  const byStart = (left: ScheduleVisit, right: ScheduleVisit) =>
    left.startAt.localeCompare(right.startAt);
  const sortDays = (days: ScheduleDay[]) =>
    days.map((day) => ({ ...day, visits: [...day.visits].sort(byStart) }));

  return {
    employees: input.employees.map((employee) => {
      const days = sortDays(buckets.get(employee.id) ?? buildEmptyDays(input.week));

      return {
        days,
        id: employee.id,
        name: employee.name,
        totalVisits: days.reduce((total, day) => total + day.visits.length, 0),
      };
    }),
    generatedAtLabel: formatScheduleGeneratedAt(input.generatedAt),
    unassigned: sortDays(unassigned),
    weekEndKey: input.week.endKey,
    weekLabel: formatScheduleWeekLabel(input.week.start, input.week.end),
    weekStartKey: input.week.startKey,
  };
};

// El panel muestra cancelaciones para que administracion las vea; el PDF que
// recibe la empleada solo lleva lo que tiene que hacer.
export const getDeliverableDays = (
  employee: ScheduleEmployee,
  visibleWeekdays?: number[]
): ScheduleDay[] =>
  employee.days
    .filter((day) => !visibleWeekdays || visibleWeekdays.includes(day.weekdayNumber))
    .map((day) => ({
      ...day,
      visits: day.visits.filter((visit) => DELIVERED_STATUSES.has(visit.status)),
    }));

export const countDeliverableVisits = (
  employee: ScheduleEmployee,
  visibleWeekdays?: number[]
) =>
  getDeliverableDays(employee, visibleWeekdays).reduce(
    (total, day) => total + day.visits.length,
    0
  );
