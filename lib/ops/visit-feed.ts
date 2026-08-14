import {
  addLocalDays,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  startOfIsoWeek,
  zonedTimeToUtc,
} from "@/lib/ops/timezone";

export const getVisitWeekRange = (
  cursor: Date,
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const weekStart = startOfIsoWeek(getLocalDate(cursor, timeZone));
  const weekEnd = addLocalDays(weekStart, 6);

  return {
    end: zonedTimeToUtc(
      {
        ...weekEnd,
        hour: 23,
        millisecond: 999,
        minute: 59,
        second: 59,
      },
      timeZone
    ),
    start: zonedTimeToUtc(weekStart, timeZone),
  };
};

export const getVisitExactDateRange = (
  exactDate: string,
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const [year, month, day] = exactDate.split("-").map(Number);
  const localDate = { day, month, year };

  return {
    end: zonedTimeToUtc(
      { ...localDate, hour: 23, millisecond: 999, minute: 59, second: 59 },
      timeZone
    ),
    start: zonedTimeToUtc(localDate, timeZone),
  };
};

export const getVisitExactDateAnchor = (
  exactDate: string,
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const [year, month, day] = exactDate.split("-").map(Number);
  return zonedTimeToUtc({ day, hour: 12, month, year }, timeZone);
};

export const getVisitFeedAnchor = (
  selectedMonth: Date,
  now = new Date(),
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const selected = getLocalDate(selectedMonth, timeZone);
  const today = getLocalDate(now, timeZone);

  if (selected.year === today.year && selected.month === today.month) {
    return now;
  }

  const nextMonth =
    selected.month === 12
      ? { day: 1, month: 1, year: selected.year + 1 }
      : { day: 1, month: selected.month + 1, year: selected.year };
  const monthEnd = addLocalDays(nextMonth, -1);

  return zonedTimeToUtc({ ...monthEnd, hour: 12 }, timeZone);
};
