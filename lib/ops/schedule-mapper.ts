import {
  formatScheduleDayMonth,
  formatScheduleGeneratedAt,
  formatScheduleLongDay,
  formatScheduleTime,
  formatScheduleWeekday,
  formatScheduleWeekLabel,
} from "@/lib/ops/schedule-format";
import { toLocalDateKey, type ScheduleWeek } from "@/lib/ops/schedule-week";
import type {
  ScheduleDay,
  ScheduleEmployee,
  ScheduleOccurrenceRow,
  ScheduleVisit,
  WeeklySchedule,
} from "@/lib/ops/schedule-types";
import {
  addLocalDays,
  DEFAULT_OPS_TIMEZONE,
  diffLocalDays,
  getLocalDate,
} from "@/lib/ops/timezone";

const DELIVERED_STATUSES = new Set(["SCHEDULED", "DONE"]);

const buildEmptyDays = (week: ScheduleWeek): ScheduleDay[] =>
  week.dates.map((date, index) => ({
    dateKey: toLocalDateKey(addLocalDays(week.startLocal, index)),
    dayLabel: formatScheduleDayMonth(date),
    longLabel: formatScheduleLongDay(date),
    visits: [],
    weekdayLabel: formatScheduleWeekday(date),
  }));

// El indice de dia se calcula en hora local: una visita de las 22:00 en
// Montevideo es del dia siguiente en UTC y caeria en la columna equivocada.
const getDayIndex = (
  occurrence: ScheduleOccurrenceRow,
  week: ScheduleWeek,
  timeZone: string
) =>
  diffLocalDays(
    getLocalDate(occurrence.scheduledStartAt, timeZone),
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
  endLabel: formatScheduleTime(occurrence.scheduledEndAt),
  id: occurrence.id,
  jobId: occurrence.jobId,
  jobName: occurrence.job.name,
  startLabel: formatScheduleTime(occurrence.scheduledStartAt),
  status: occurrence.status,
  teammates: occurrence.employees
    .map((assignment) => assignment.employee)
    .filter((employee) => employee.id !== employeeId)
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

    if (!occurrence.employees.length) {
      unassigned[dayIndex].visits.push(toVisit(occurrence, null));
      return;
    }

    occurrence.employees.forEach(({ employee }) => {
      const days = buckets.get(employee.id);
      days?.[dayIndex].visits.push(toVisit(occurrence, employee.id));
    });
  });

  const employees: ScheduleEmployee[] = input.employees.map((employee) => {
    const days = buckets.get(employee.id) ?? buildEmptyDays(input.week);

    return {
      days,
      id: employee.id,
      name: employee.name,
      totalVisits: days.reduce((total, day) => total + day.visits.length, 0),
    };
  });

  return {
    employees,
    generatedAtLabel: formatScheduleGeneratedAt(input.generatedAt),
    unassigned,
    weekEndKey: input.week.endKey,
    weekLabel: formatScheduleWeekLabel(input.week.start, input.week.end),
    weekStartKey: input.week.startKey,
  };
};

// El panel muestra cancelaciones para que administracion las vea; el PDF que
// recibe la empleada solo lleva lo que tiene que hacer.
export const getDeliverableDays = (employee: ScheduleEmployee): ScheduleDay[] =>
  employee.days.map((day) => ({
    ...day,
    visits: day.visits.filter((visit) => DELIVERED_STATUSES.has(visit.status)),
  }));

export const countDeliverableVisits = (employee: ScheduleEmployee) =>
  getDeliverableDays(employee).reduce((total, day) => total + day.visits.length, 0);
