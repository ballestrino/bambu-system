// Lógica pura de "Limpiar visitas" (feature 73): la usan el servidor, la vista
// y los checks, así la vista promete lo mismo que el servidor hace.
import type { OccurrenceStatus } from "@prisma/client";

import { parseWeekDateKey, toLocalDateKey } from "@/lib/ops/schedule-week";
import {
  addLocalDays,
  DEFAULT_OPS_TIMEZONE,
  getLocalDate,
  startOfIsoWeek,
  zonedTimeToUtc,
  type LocalDate,
} from "@/lib/ops/timezone";
import type { ScheduleRuleCleanupDirection } from "@/schemas/ops/schedule-rule-board";

export type RuleVisitState = "done" | "pending" | "future" | "off";

export type RuleVisitLike = {
  actualEndAt?: Date | string | null;
  actualStartAt?: Date | string | null;
  scheduledStartAt: Date | string;
  status: OccurrenceStatus;
  timeEntryCount: number;
};

const parseKey = (key: string): LocalDate => {
  const parsed = parseWeekDateKey(key);
  if (!parsed) throw new Error(`Fecha inválida: ${key}`);
  return parsed;
};

export const shiftDayKey = (key: string, days: number) => toLocalDateKey(addLocalDays(parseKey(key), days));

export const mondayOfKey = (key: string) => toLocalDateKey(startOfIsoWeek(parseKey(key)));

export const dayKeyOf = (value: Date | string, timeZone = DEFAULT_OPS_TIMEZONE) =>
  toLocalDateKey(getLocalDate(new Date(value), timeZone));

// 00:00 del día en Montevideo: así se guardan las fechas de una regla.
export const dayStartUtc = (key: string, timeZone = DEFAULT_OPS_TIMEZONE) =>
  zonedTimeToUtc(parseKey(key), timeZone);

export const dayEndUtc = (key: string, timeZone = DEFAULT_OPS_TIMEZONE) =>
  zonedTimeToUtc({ ...parseKey(key), hour: 23, millisecond: 999, minute: 59, second: 59 }, timeZone);

// Solo se borra lo que nunca pasó: programada, sin horario real y sin horas
// cargadas. Realizadas, omitidas, canceladas y con horas quedan.
export const isDeletableRuleVisit = (visit: RuleVisitLike) =>
  visit.status === "SCHEDULED" && !visit.actualStartAt && !visit.actualEndAt && visit.timeEntryCount === 0;

export const classifyRuleVisit = (visit: RuleVisitLike, todayKey: string): RuleVisitState => {
  if (visit.status === "DONE") return "done";
  if (visit.status !== "SCHEDULED") return "off";
  return dayKeyOf(visit.scheduledStartAt) < todayKey ? "pending" : "future";
};

export const isInsideCleanup = (dayKey: string, direction: ScheduleRuleCleanupDirection, cutDate: string) =>
  direction === "FORWARD" ? dayKey >= cutDate : dayKey <= cutDate;

export const getCleanupWindow = (direction: ScheduleRuleCleanupDirection, cutDate: string) =>
  direction === "FORWARD" ? { gte: dayStartUtc(cutDate) } : { lte: dayEndUtc(cutDate) };

// Las fechas de la regla después del corte: termina el día anterior (hacia
// adelante) o empieza el día siguiente (hacia atrás).
export const getAdjustedRuleDates = (
  direction: ScheduleRuleCleanupDirection,
  cutDate: string,
  rule: { startKey: string; endKey: string | null }
) => {
  const startKey = direction === "BACK" ? shiftDayKey(cutDate, 1) : rule.startKey;
  const endKey = direction === "FORWARD" ? shiftDayKey(cutDate, -1) : rule.endKey;
  const valid = !endKey || endKey >= startKey;
  return { endKey, startKey, valid };
};

export type CleanupCounts = { deletable: number; future: number; kept: number; pending: number };

export const countCleanup = (
  visits: RuleVisitLike[],
  direction: ScheduleRuleCleanupDirection,
  cutDate: string,
  todayKey: string
): CleanupCounts => {
  const counts: CleanupCounts = { deletable: 0, future: 0, kept: 0, pending: 0 };
  for (const visit of visits) {
    if (!isInsideCleanup(dayKeyOf(visit.scheduledStartAt), direction, cutDate)) continue;
    if (!isDeletableRuleVisit(visit)) {
      counts.kept += 1;
      continue;
    }
    counts.deletable += 1;
    if (classifyRuleVisit(visit, todayKey) === "pending") counts.pending += 1;
    else counts.future += 1;
  }
  return counts;
};
