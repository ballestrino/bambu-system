import "server-only";

import type { JobScheduleRule } from "@prisma/client";

import {
  addLocalDays,
  addLocalMonths,
  compareLocalDates,
  DEFAULT_OPS_TIMEZONE,
  diffLocalDays,
  diffLocalMonths,
  endOfZonedDay,
  getIsoWeekday,
  getLocalDate,
  startOfIsoWeek,
  startOfZonedDay,
  zonedTimeToUtc,
  type LocalDate,
} from "@/lib/ops/timezone";

export const MAX_GENERATION_MONTHS = 3;
export const MINUTE = 60 * 1000;

export type GenerationRange = {
  start: Date;
  end: Date;
};

const maxDate = (...dates: Date[]) =>
  new Date(Math.max(...dates.map((date) => date.getTime())));

const minDate = (...dates: Date[]) =>
  new Date(Math.min(...dates.map((date) => date.getTime())));

const getRuleTimezone = (rule: JobScheduleRule) =>
  rule.timezone || DEFAULT_OPS_TIMEZONE;

export const getGenerationHorizonEnd = (
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const today = getLocalDate(new Date(), timeZone);
  const horizon = addLocalMonths(today, MAX_GENERATION_MONTHS);

  return zonedTimeToUtc(
    {
      ...horizon,
      hour: 23,
      millisecond: 999,
      minute: 59,
      second: 59,
    },
    timeZone
  );
};

export const getGenerationStart = (
  rangeStart?: Date,
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const today = getLocalDate(new Date(), timeZone);
  const requested = rangeStart ? getLocalDate(rangeStart, timeZone) : today;
  const start = compareLocalDates(requested, today) > 0 ? requested : today;

  return zonedTimeToUtc(start, timeZone);
};

export const getGenerationWindow = (
  rule: JobScheduleRule,
  rangeStart?: Date,
  rangeEnd?: Date
): GenerationRange | null => {
  const timeZone = getRuleTimezone(rule);
  const horizonEnd = getGenerationHorizonEnd(timeZone);
  const requestedStart = getGenerationStart(rangeStart, timeZone);
  const requestedEnd = rangeEnd
    ? endOfZonedDay(rangeEnd, timeZone)
    : horizonEnd;
  const start = maxDate(startOfZonedDay(rule.startDate, timeZone), requestedStart);
  const end = minDate(
    rule.endDate ? endOfZonedDay(rule.endDate, timeZone) : horizonEnd,
    requestedEnd,
    horizonEnd
  );

  return start.getTime() <= end.getTime() ? { start, end } : null;
};

const matchesRuleDate = (
  rule: JobScheduleRule,
  date: LocalDate,
  timeZone: string
) => {
  const ruleStart = getLocalDate(rule.startDate, timeZone);

  if (compareLocalDates(date, ruleStart) < 0) {
    return false;
  }

  if (rule.frequency === "DAILY") {
    return diffLocalDays(date, ruleStart) % rule.interval === 0;
  }

  if (rule.frequency === "WEEKLY") {
    const weekDiff = Math.floor(
      diffLocalDays(startOfIsoWeek(date), startOfIsoWeek(ruleStart)) / 7
    );

    return (
      weekDiff % rule.interval === 0 &&
      rule.weekdays.includes(getIsoWeekday(date))
    );
  }

  const monthDiff = diffLocalMonths(date, ruleStart);
  return (
    monthDiff >= 0 &&
    monthDiff % rule.interval === 0 &&
    date.day === rule.dayOfMonth
  );
};

const buildOccurrenceStart = (
  rule: JobScheduleRule,
  date: LocalDate,
  timeZone: string
) =>
  zonedTimeToUtc(
    {
      ...date,
      hour: Math.floor(rule.startTimeMinutes / 60),
      minute: rule.startTimeMinutes % 60,
    },
    timeZone
  );

export const buildCandidateStarts = (
  rule: JobScheduleRule,
  range: GenerationRange
) => {
  const starts: Date[] = [];
  const timeZone = getRuleTimezone(rule);
  const rangeEndDate = getLocalDate(range.end, timeZone);
  let cursor = getLocalDate(range.start, timeZone);

  while (compareLocalDates(cursor, rangeEndDate) <= 0) {
    if (matchesRuleDate(rule, cursor, timeZone)) {
      const start = buildOccurrenceStart(rule, cursor, timeZone);
      if (
        start.getTime() >= range.start.getTime() &&
        start.getTime() <= range.end.getTime()
      ) {
        starts.push(start);
      }
    }

    cursor = addLocalDays(cursor, 1);
  }

  return starts;
};
