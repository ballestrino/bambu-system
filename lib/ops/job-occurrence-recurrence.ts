// Pure recurrence math: no database, so scripts can check it.
import type { JobScheduleRule } from "@prisma/client";

import { getGenerationHorizonEnd } from "@/lib/ops/generation-horizon";
import {
  addLocalDays,
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

// The part of a manual generation range a rule covers: from its start date to
// its end date, never past the 3-month horizon. Past days are allowed.
export const getRuleGenerationWindow = (
  rule: JobScheduleRule,
  range: GenerationRange
): GenerationRange | null => {
  const timeZone = getRuleTimezone(rule);
  const horizonEnd = getGenerationHorizonEnd(timeZone);
  const start = maxDate(startOfZonedDay(rule.startDate, timeZone), range.start);
  const end = minDate(
    rule.endDate ? endOfZonedDay(rule.endDate, timeZone) : horizonEnd,
    range.end,
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
