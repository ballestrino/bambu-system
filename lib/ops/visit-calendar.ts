import { formatScheduleLongDay } from "@/lib/ops/schedule-format";
import { parseWeekDateKey, toLocalDateKey } from "@/lib/ops/schedule-week";
import {
  addLocalDays,
  DEFAULT_OPS_TIMEZONE,
  getIsoWeekday,
  startOfIsoWeek,
  zonedTimeToUtc,
  type LocalDate,
} from "@/lib/ops/timezone";

export type VisitCalendarDay = {
  day: number;
  dayKey: string;
  shortWeekday: string;
  weekdayLetter: string;
  weekdayNumber: number;
};

const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAY_LETTER = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const parseDayKey = (dayKey: string): LocalDate =>
  parseWeekDateKey(dayKey) ?? { day: 1, month: 1, year: 1970 };

const toCalendarDay = (date: LocalDate): VisitCalendarDay => {
  const weekdayNumber = getIsoWeekday(date);
  return {
    day: date.day,
    dayKey: toLocalDateKey(date),
    shortWeekday: WEEKDAY_SHORT[weekdayNumber - 1],
    weekdayLetter: WEEKDAY_LETTER[weekdayNumber - 1],
    weekdayNumber,
  };
};

export const VISIT_WEEKDAY_LETTERS = WEEKDAY_LETTER;

export const shiftDayKey = (dayKey: string, days: number) =>
  toLocalDateKey(addLocalDays(parseDayKey(dayKey), days));

export const getDayKeyMonth = (dayKey: string) => {
  const date = parseDayKey(dayKey);
  return { month: date.month, year: date.year };
};

export const getDayKeyWeekday = (dayKey: string) => getIsoWeekday(parseDayKey(dayKey));

// La semana de lunes a domingo que contiene el dia elegido.
export const getWeekDays = (dayKey: string) => {
  const monday = startOfIsoWeek(parseDayKey(dayKey));
  return Array.from({ length: 7 }, (_, index) => toCalendarDay(addLocalDays(monday, index)));
};

// Grilla del mes que empieza en lunes; null rellena los huecos de los bordes.
export const getMonthGrid = (year: number, month: number) => {
  const first: LocalDate = { day: 1, month, year };
  const lead = getIsoWeekday(first) - 1;
  const days: (VisitCalendarDay | null)[] = Array.from({ length: lead }, () => null);

  for (let date = first; date.month === month; date = addLocalDays(date, 1)) {
    days.push(toCalendarDay(date));
  }
  while (days.length % 7) days.push(null);
  return days;
};

const toNoon = (dayKey: string) =>
  zonedTimeToUtc({ ...parseDayKey(dayKey), hour: 12 }, DEFAULT_OPS_TIMEZONE);

// Un minuto del dia elegido como instante real, en hora de Montevideo.
export const getDayKeyInstant = (dayKey: string, minute: number) =>
  zonedTimeToUtc(
    { ...parseDayKey(dayKey), hour: Math.floor(minute / 60), minute: minute % 60 },
    DEFAULT_OPS_TIMEZONE
  );

// "Viernes 9 de octubre".
export const formatDayLabel = (dayKey: string) => formatScheduleLongDay(toNoon(dayKey));

export const formatMonthLabel = (year: number, month: number) =>
  `${MONTHS[month - 1].charAt(0).toUpperCase()}${MONTHS[month - 1].slice(1)} ${year}`;

// "5 – 11 de octubre" o "29 de septiembre – 5 de octubre".
export const formatWeekRange = (startKey: string, endKey: string) => {
  const start = parseDayKey(startKey);
  const end = parseDayKey(endKey);
  return start.month === end.month
    ? `${start.day} – ${end.day} de ${MONTHS[end.month - 1]}`
    : `${start.day} de ${MONTHS[start.month - 1]} – ${end.day} de ${MONTHS[end.month - 1]}`;
};

// Primer dia que se muestra en un mes: hoy si es el mes actual, si no el 1.
export const getDefaultDayKey = (year: number, month: number, todayKey: string | null) => {
  if (todayKey) {
    const today = parseDayKey(todayKey);
    if (today.year === year && today.month === month) return todayKey;
  }
  return toLocalDateKey({ day: 1, month, year });
};
