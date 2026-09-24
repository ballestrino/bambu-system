import { parseWeekDateKey, toLocalDateKey } from "@/lib/ops/schedule-week";
import {
  addLocalDays,
  addLocalMonths,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  startOfIsoWeek,
  type LocalDate,
} from "@/lib/ops/timezone";

// Suggested ranges for the "Generar visitas" dialog. The user can always edit
// the dates: a service that starts on the 25th is generated from the 25th.
export type OccurrenceGenerationPreset = {
  endDate: string;
  label: string;
  startDate: string;
};

const parseKey = (key: string): LocalDate => {
  const parsed = parseWeekDateKey(key);
  if (!parsed) throw new Error(`Fecha inválida: ${key}`);
  return parsed;
};

const endOfMonth = (date: LocalDate) =>
  addLocalDays(addLocalMonths({ ...date, day: 1 }, 1), -1);

export const getTodayKey = (now = new Date(), timeZone = DEFAULT_OPS_TIMEZONE) =>
  toLocalDateKey(getLocalDate(now, timeZone));

// Monday to Sunday of the week that contains the day.
export const weekPreset = (dateKey: string, label = "Semana"): OccurrenceGenerationPreset => {
  const monday = startOfIsoWeek(parseKey(dateKey));
  return {
    endDate: toLocalDateKey(addLocalDays(monday, 6)),
    label,
    startDate: toLocalDateKey(monday),
  };
};

// The whole month that contains the day.
export const monthPreset = (dateKey: string, label = "Mes"): OccurrenceGenerationPreset => {
  const date = parseKey(dateKey);
  return {
    endDate: toLocalDateKey(endOfMonth(date)),
    label,
    startDate: toLocalDateKey({ ...date, day: 1 }),
  };
};

// From the day to the end of its month.
export const untilMonthEndPreset = (
  dateKey: string,
  label = "Hasta fin de mes"
): OccurrenceGenerationPreset => ({
  endDate: toLocalDateKey(endOfMonth(parseKey(dateKey))),
  label,
  startDate: dateKey,
});

// A number of days from the day, for a rule that starts mid-week.
export const nextDaysPreset = (
  dateKey: string,
  days: number,
  label: string
): OccurrenceGenerationPreset => ({
  endDate: toLocalDateKey(addLocalDays(parseKey(dateKey), days - 1)),
  label,
  startDate: dateKey,
});

export const laterDateKey = (left: string, right: string) => (left > right ? left : right);
