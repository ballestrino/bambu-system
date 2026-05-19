export const DEFAULT_OPS_TIMEZONE = "America/Montevideo";

const DAY = 24 * 60 * 60 * 1000;

export type LocalDate = {
  day: number;
  month: number;
  year: number;
};

type LocalDateTime = LocalDate & {
  hour?: number;
  millisecond?: number;
  minute?: number;
  second?: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string) => {
  const cached = formatters.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
  formatters.set(timeZone, formatter);
  return formatter;
};

const getZonedParts = (date: Date, timeZone: string) => {
  const parts = getFormatter(timeZone).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    month: value("month"),
    second: value("second"),
    year: value("year"),
  };
};

export const getLocalDate = (date: Date, timeZone: string): LocalDate => {
  const parts = getZonedParts(date, timeZone);
  return {
    day: parts.day,
    month: parts.month,
    year: parts.year,
  };
};

const localDateUtcMs = (date: LocalDate) =>
  Date.UTC(date.year, date.month - 1, date.day);

export const compareLocalDates = (left: LocalDate, right: LocalDate) =>
  localDateUtcMs(left) - localDateUtcMs(right);

export const addLocalDays = (date: LocalDate, days: number): LocalDate => {
  const next = new Date(localDateUtcMs(date));
  next.setUTCDate(next.getUTCDate() + days);
  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
};

export const addLocalMonths = (date: LocalDate, months: number): LocalDate => {
  const next = new Date(localDateUtcMs(date));
  next.setUTCMonth(next.getUTCMonth() + months);
  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
};

export const diffLocalDays = (left: LocalDate, right: LocalDate) =>
  Math.floor((localDateUtcMs(left) - localDateUtcMs(right)) / DAY);

export const diffLocalMonths = (left: LocalDate, right: LocalDate) =>
  (left.year - right.year) * 12 + left.month - right.month;

export const getIsoWeekday = (date: LocalDate) => {
  const weekday = new Date(localDateUtcMs(date)).getUTCDay();
  return weekday || 7;
};

export const startOfIsoWeek = (date: LocalDate) =>
  addLocalDays(date, -(getIsoWeekday(date) - 1));

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - (date.getTime() - date.getMilliseconds());
};

export const zonedTimeToUtc = (dateTime: LocalDateTime, timeZone: string) => {
  const utcGuess = Date.UTC(
    dateTime.year,
    dateTime.month - 1,
    dateTime.day,
    dateTime.hour ?? 0,
    dateTime.minute ?? 0,
    dateTime.second ?? 0,
    dateTime.millisecond ?? 0
  );
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const firstUtc = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(firstUtc), timeZone);

  return new Date(utcGuess - secondOffset);
};

export const startOfZonedDay = (date: Date, timeZone: string) =>
  zonedTimeToUtc(getLocalDate(date, timeZone), timeZone);

export const endOfZonedDay = (date: Date, timeZone: string) =>
  zonedTimeToUtc(
    {
      ...getLocalDate(date, timeZone),
      hour: 23,
      millisecond: 999,
      minute: 59,
      second: 59,
    },
    timeZone
  );
