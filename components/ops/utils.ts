const dateTimeFormat = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormat = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
});

const monthFormat = new Intl.DateTimeFormat("es-UY", {
  month: "long",
  year: "numeric",
});

const utcMonthFormat = new Intl.DateTimeFormat("es-UY", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("es-UY", {
  timeStyle: "short",
});

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());
const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export const formatDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return dateFormat.format(new Date(value));
};

export const formatMonth = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return monthFormat.format(new Date(value));
};

export const formatUtcMonth = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return utcMonthFormat.format(new Date(value));
};

export const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return dateTimeFormat.format(new Date(value));
};

export const formatTime = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return timeFormat.format(new Date(value));
};

export const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (!isValidDate(date)) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

export const toDateTimeLocalValue = (
  value: Date | string | null | undefined
) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (!isValidDate(date)) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const parseDateTimeLocalValue = (value: string) => {
  if (!value) {
    return undefined;
  }

  const match = value.match(localDateTimePattern);
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hours, minutes] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return isValidDate(date) ? date : undefined;
};

export const getMonthRange = (month: Date) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

export const getMonthKey = (month: Date) =>
  `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

export const getUtcMonthKey = (month: Date) =>
  `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;

export const parseUtcMonthKey = (monthKey: string) => {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return undefined;
  }

  const [, year, month] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return isValidDate(date) ? date : undefined;
};

export const minutesToTimeInput = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const timeInputToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
