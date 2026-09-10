import { DEFAULT_OPS_TIMEZONE } from "@/lib/ops/timezone";

const zoned = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-UY", { ...options, timeZone: DEFAULT_OPS_TIMEZONE });

const timeFormat = zoned({ hour: "2-digit", hourCycle: "h23", minute: "2-digit" });
const weekdayFormat = zoned({ weekday: "long" });
const dayMonthFormat = zoned({ day: "2-digit", month: "2-digit" });
const dayFormat = zoned({ day: "numeric" });
const monthFormat = zoned({ month: "long" });
const yearFormat = zoned({ year: "numeric" });
const generatedAtFormat = zoned({ dateStyle: "short", timeStyle: "short" });

export const capitalize = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

// Node e ICU devuelven el mes capitalizado en algunas versiones; en espanol va
// en minuscula y el resultado debe ser igual en servidor y navegador.
const monthName = (value: Date) => monthFormat.format(value).toLowerCase();

// Todos los formatos fijan America/Montevideo: el cronograma se imprime y se
// reparte, asi que la hora no puede depender de la zona del navegador.
export const formatScheduleTime = (value: Date) => timeFormat.format(value);

export const formatScheduleWeekday = (value: Date) =>
  capitalize(weekdayFormat.format(value));

export const formatScheduleDayMonth = (value: Date) => dayMonthFormat.format(value);

export const formatScheduleLongDay = (value: Date) =>
  `${capitalize(weekdayFormat.format(value))} ${dayFormat.format(value)} de ${monthName(value)}`;

export const formatScheduleGeneratedAt = (value: Date) =>
  generatedAtFormat.format(value);

export const formatScheduleWeekLabel = (start: Date, end: Date) => {
  const startDay = dayFormat.format(start);
  const endDay = dayFormat.format(end);
  const startMonth = monthName(start);
  const endMonth = monthName(end);
  const startYear = yearFormat.format(start);
  const endYear = yearFormat.format(end);

  if (startYear !== endYear) {
    return `Semana del ${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
  }

  if (startMonth !== endMonth) {
    return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${endYear}`;
  }

  return `Semana del ${startDay} al ${endDay} de ${endMonth} de ${endYear}`;
};
