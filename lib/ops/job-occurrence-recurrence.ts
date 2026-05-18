import "server-only";

import type { JobScheduleRule } from "@prisma/client";

export const MAX_GENERATION_MONTHS = 3;
export const MINUTE = 60 * 1000;

const DAY = 24 * 60 * MINUTE;

export type GenerationRange = {
  start: Date;
  end: Date;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const maxDate = (...dates: Date[]) =>
  new Date(Math.max(...dates.map((date) => date.getTime())));

const minDate = (...dates: Date[]) =>
  new Date(Math.min(...dates.map((date) => date.getTime())));

const diffDays = (left: Date, right: Date) =>
  Math.floor((startOfDay(left).getTime() - startOfDay(right).getTime()) / DAY);

const getWeekday = (date: Date) => date.getDay() || 7;

const startOfIsoWeek = (date: Date) => {
  const day = startOfDay(date);
  day.setDate(day.getDate() - (getWeekday(day) - 1));
  return day;
};

const diffMonths = (left: Date, right: Date) =>
  (left.getFullYear() - right.getFullYear()) * 12 +
  left.getMonth() -
  right.getMonth();

export const getGenerationHorizonEnd = () =>
  endOfDay(addMonths(startOfDay(new Date()), MAX_GENERATION_MONTHS));

export const getGenerationStart = (rangeStart?: Date) => {
  const today = startOfDay(new Date());
  return rangeStart ? maxDate(startOfDay(rangeStart), today) : today;
};

export const getGenerationWindow = (
  rule: JobScheduleRule,
  rangeStart?: Date,
  rangeEnd?: Date
): GenerationRange | null => {
  const horizonEnd = getGenerationHorizonEnd();
  const requestedStart = getGenerationStart(rangeStart);
  const requestedEnd = rangeEnd ? endOfDay(rangeEnd) : horizonEnd;
  const start = maxDate(startOfDay(rule.startDate), requestedStart);
  const end = minDate(rule.endDate ?? horizonEnd, requestedEnd, horizonEnd);

  return start.getTime() <= end.getTime() ? { start, end } : null;
};

const matchesRuleDate = (rule: JobScheduleRule, date: Date) => {
  if (date.getTime() < startOfDay(rule.startDate).getTime()) {
    return false;
  }

  if (rule.frequency === "DAILY") {
    return diffDays(date, rule.startDate) % rule.interval === 0;
  }

  if (rule.frequency === "WEEKLY") {
    const weekDiff = Math.floor(
      diffDays(startOfIsoWeek(date), startOfIsoWeek(rule.startDate)) / 7
    );
    return (
      weekDiff % rule.interval === 0 &&
      rule.weekdays.includes(getWeekday(date))
    );
  }

  const monthDiff = diffMonths(date, rule.startDate);
  return (
    monthDiff >= 0 &&
    monthDiff % rule.interval === 0 &&
    date.getDate() === rule.dayOfMonth
  );
};

const buildOccurrenceStart = (rule: JobScheduleRule, date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(rule.startTimeMinutes / 60),
    rule.startTimeMinutes % 60
  );

export const buildCandidateStarts = (
  rule: JobScheduleRule,
  range: GenerationRange
) => {
  const starts: Date[] = [];
  const cursor = startOfDay(range.start);

  while (cursor.getTime() <= range.end.getTime()) {
    if (matchesRuleDate(rule, cursor)) {
      const start = buildOccurrenceStart(rule, cursor);
      if (
        start.getTime() >= range.start.getTime() &&
        start.getTime() <= range.end.getTime()
      ) {
        starts.push(start);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return starts;
};
