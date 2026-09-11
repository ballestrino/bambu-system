import type { EmployeeAvailabilityKind } from "@prisma/client";

import {
  DAY_MINUTES,
  normalizeRanges,
  subtractRange,
  type MinuteRange,
} from "@/lib/ops/minute-ranges";

// Forma minima de una regla. El row de Prisma la cumple, y los checks pueden
// armarla a mano sin pasar por la base.
export type ScheduleAvailabilityRule = {
  employeeId: string;
  endMinute: number;
  kind: EmployeeAvailabilityKind;
  note?: string | null;
  startMinute: number;
  weekdays: number[];
};

// Sin reglas cargadas el cronograma asume la jornada habitual: buscar huecos
// entre las 00:00 y las 24:00 devolveria tramos que nadie va a trabajar.
export const DEFAULT_AVAILABILITY_WINDOW: MinuteRange = {
  endMinute: 18 * 60,
  startMinute: 8 * 60,
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const getAvailabilityWeekdayLabel = (weekdayNumber: number) =>
  WEEKDAY_LABELS[weekdayNumber - 1] ?? String(weekdayNumber);

export const formatAvailabilityWeekdays = (weekdays: number[]) => {
  if (!weekdays.length || weekdays.length === 7) {
    return "Todos los días";
  }

  return [...weekdays]
    .sort((left, right) => left - right)
    .map(getAvailabilityWeekdayLabel)
    .join(", ");
};

export const groupAvailabilityRules = (rules: ScheduleAvailabilityRule[]) =>
  rules.reduce((grouped, rule) => {
    const current = grouped.get(rule.employeeId);
    if (current) {
      current.push(rule);
    } else {
      grouped.set(rule.employeeId, [rule]);
    }

    return grouped;
  }, new Map<string, ScheduleAvailabilityRule[]>());

const appliesToWeekday = (rule: ScheduleAvailabilityRule, weekdayNumber: number) =>
  !rule.weekdays.length || rule.weekdays.includes(weekdayNumber);

const toRange = (rule: ScheduleAvailabilityRule): MinuteRange => ({
  endMinute: Math.min(DAY_MINUTES, rule.endMinute),
  startMinute: Math.max(0, rule.startMinute),
});

// Las reglas AVAILABLE reemplazan la ventana por defecto de ese dia; las
// UNAVAILABLE recortan lo que quede. Asi "solo trabaja de manana" y "los
// viernes no viene" se expresan sin inventar un tercer concepto.
export const getAvailabilityWindows = (
  rules: ScheduleAvailabilityRule[],
  weekdayNumber: number
): MinuteRange[] => {
  const dayRules = rules.filter((rule) => appliesToWeekday(rule, weekdayNumber));
  const openRules = dayRules.filter((rule) => rule.kind === "AVAILABLE");
  const base = openRules.length
    ? normalizeRanges(openRules.map(toRange))
    : [{ ...DEFAULT_AVAILABILITY_WINDOW }];

  return dayRules
    .filter((rule) => rule.kind === "UNAVAILABLE")
    .reduce((windows, rule) => subtractRange(windows, toRange(rule)), base);
};

export const hasAvailabilityRules = (rules: ScheduleAvailabilityRule[]) =>
  rules.length > 0;

export const getAvailabilityMinutes = (windows: MinuteRange[]) =>
  windows.reduce((total, window) => total + window.endMinute - window.startMinute, 0);
