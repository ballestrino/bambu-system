// Tira de semanas de "Limpiar visitas": 7 semanas antes de la actual, la
// actual y 8 después. Cada visita de la regla cae en su semana con su estado.
import {
  classifyRuleVisit,
  dayKeyOf,
  isDeletableRuleVisit,
  isInsideCleanup,
  mondayOfKey,
  shiftDayKey,
  type RuleVisitLike,
  type RuleVisitState,
} from "@/lib/ops/schedule-rule-cleanup-window";
import type { ScheduleRuleCleanupDirection } from "@/schemas/ops/schedule-rule-board";

export const STRIP_WEEKS = 16;
export const STRIP_CURRENT_INDEX = 7;

export type StripVisit = RuleVisitLike & { id: string };

export type StripDot = { deletable: boolean; id: string; inside: boolean; state: RuleVisitState };

export type StripWeek = {
  dayNumber: string;
  dots: StripDot[];
  index: number;
  inside: boolean;
  isCurrent: boolean;
  isCut: boolean;
  mondayKey: string;
  sundayKey: string;
  top: string;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const getStripMondays = (todayKey: string) => {
  const first = shiftDayKey(mondayOfKey(todayKey), -7 * STRIP_CURRENT_INDEX);
  return Array.from({ length: STRIP_WEEKS }, (_, index) => shiftDayKey(first, index * 7));
};

export const defaultCutIndex = (direction: ScheduleRuleCleanupDirection) =>
  direction === "FORWARD" ? STRIP_CURRENT_INDEX + 1 : STRIP_CURRENT_INDEX - 1;

// Hacia adelante corta desde el lunes de la semana elegida; hacia atrás, hasta
// su domingo.
export const getCutDate = (todayKey: string, direction: ScheduleRuleCleanupDirection, cutIndex: number) => {
  const monday = getStripMondays(todayKey)[cutIndex];
  return direction === "FORWARD" ? monday : shiftDayKey(monday, 6);
};

export const buildStripWeeks = (
  todayKey: string,
  visits: StripVisit[],
  direction: ScheduleRuleCleanupDirection,
  cutIndex: number
): StripWeek[] => {
  const cutDate = getCutDate(todayKey, direction, cutIndex);
  return getStripMondays(todayKey).map((mondayKey, index, mondays) => {
    const sundayKey = shiftDayKey(mondayKey, 6);
    const inside = direction === "FORWARD" ? index >= cutIndex : index <= cutIndex;
    const newMonth = index === 0 || mondays[index - 1].slice(5, 7) !== mondayKey.slice(5, 7);
    const isCurrent = index === STRIP_CURRENT_INDEX;
    const dots = visits
      .filter((visit) => {
        const key = dayKeyOf(visit.scheduledStartAt);
        return key >= mondayKey && key <= sundayKey;
      })
      .map((visit) => ({
        deletable: isDeletableRuleVisit(visit),
        id: visit.id,
        inside: isInsideCleanup(dayKeyOf(visit.scheduledStartAt), direction, cutDate),
        state: classifyRuleVisit(visit, todayKey),
      }));
    return {
      dayNumber: String(Number(mondayKey.slice(8, 10))),
      dots,
      index,
      inside,
      isCurrent,
      isCut: index === cutIndex,
      mondayKey,
      sundayKey,
      top: isCurrent ? "hoy" : newMonth ? MONTHS[Number(mondayKey.slice(5, 7)) - 1] : "",
    };
  });
};
