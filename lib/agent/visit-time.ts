import { DEFAULT_OPS_TIMEZONE, getLocalDateTime, zonedTimeToUtc } from "@/lib/ops/timezone";

// Horarios de visitas en hora de Montevideo. El modelo lee y escribe
// "AAAA-MM-DD HH:mm", el mismo formato que devuelve queryOperations. Puro.
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

// null si no es una fecha y hora reales: 2026-02-30 o 24:00 no dan la vuelta.
export const parseLocalDateTime = (value: string, timeZone = DEFAULT_OPS_TIMEZONE) => {
  const match = LOCAL_DATE_TIME.exec(value.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = zonedTimeToUtc({ day, hour, minute, month, year }, timeZone);
  const back = getLocalDateTime(date, timeZone);
  const same =
    back.year === year && back.month === month && back.day === day && back.hour === hour && back.minute === minute;
  return same ? date : null;
};

export const formatLocalDateTime = (date: Date, timeZone = DEFAULT_OPS_TIMEZONE) => {
  const local = getLocalDateTime(date, timeZone);
  return `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour)}:${pad(local.minute)}`;
};

const dayFormat = new Intl.DateTimeFormat("es-UY", {
  day: "2-digit",
  month: "2-digit",
  timeZone: DEFAULT_OPS_TIMEZONE,
  weekday: "short",
});
const timeFormat = new Intl.DateTimeFormat("es-UY", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: DEFAULT_OPS_TIMEZONE,
});

const formatDay = (date: Date) => dayFormat.format(date).replace(",", "").replace(".", "");

// "mar 21/10 09:00–13:00", o con los dos días si cruza la medianoche.
export const formatVisitRange = (start: Date, end: Date) => {
  const startDay = formatDay(start);
  const endDay = formatDay(end);
  const endText = startDay === endDay ? timeFormat.format(end) : `${endDay} ${timeFormat.format(end)}`;
  return `${startDay} ${timeFormat.format(start)}–${endText}`;
};
