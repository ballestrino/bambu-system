import { getGenerationHorizonEnd } from "@/lib/ops/generation-horizon";
import {
  addLocalDays,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  startOfIsoWeek,
  zonedTimeToUtc,
  type LocalDate,
} from "@/lib/ops/timezone";
import { getVisitWeekRange } from "@/lib/ops/visit-feed";

export type ScheduleWeek = {
  dates: Date[];
  end: Date;
  endKey: string;
  start: Date;
  startKey: string;
  startLocal: LocalDate;
};

const WEEK_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const toLocalDateKey = (date: LocalDate) =>
  [
    String(date.year).padStart(4, "0"),
    String(date.month).padStart(2, "0"),
    String(date.day).padStart(2, "0"),
  ].join("-");

// Se ancla al mediodia local: la medianoche puede deslizarse un dia al convertir
// entre zonas y arrastrar el calculo del lunes.
export const parseScheduleWeekParam = (
  value: string | undefined,
  now = new Date(),
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const match = value?.match(WEEK_KEY_PATTERN);
  if (!match) {
    return now;
  }

  const [, year, month, day] = match;
  const anchor = zonedTimeToUtc(
    { day: Number(day), hour: 12, month: Number(month), year: Number(year) },
    timeZone
  );

  return Number.isNaN(anchor.getTime()) ? now : anchor;
};

export const getScheduleWeek = (
  cursor: Date,
  timeZone = DEFAULT_OPS_TIMEZONE
): ScheduleWeek => {
  const range = getVisitWeekRange(cursor, timeZone);
  const startLocal = startOfIsoWeek(getLocalDate(cursor, timeZone));
  const dates = Array.from({ length: 7 }, (_, index) =>
    zonedTimeToUtc({ ...addLocalDays(startLocal, index), hour: 12 }, timeZone)
  );

  return {
    dates,
    end: range.end,
    endKey: toLocalDateKey(addLocalDays(startLocal, 6)),
    start: range.start,
    startKey: toLocalDateKey(startLocal),
    startLocal,
  };
};

export const shiftScheduleWeekKey = (
  startKey: string,
  weeks: number,
  timeZone = DEFAULT_OPS_TIMEZONE
) => {
  const week = getScheduleWeek(parseScheduleWeekParam(startKey), timeZone);
  return toLocalDateKey(addLocalDays(week.startLocal, weeks * 7));
};

// Mas alla del horizonte de generacion no hay ocurrencias materializadas, asi
// que la semana saldria vacia sin explicacion.
export const isBeyondGenerationHorizon = (
  weekStart: Date,
  timeZone = DEFAULT_OPS_TIMEZONE
) => weekStart.getTime() > getGenerationHorizonEnd(timeZone).getTime();
