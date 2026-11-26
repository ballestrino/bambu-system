"use client";

import { useState } from "react";

import {
  countCleanup,
  dayKeyOf,
  isDeletableRuleVisit,
  isInsideCleanup,
  shiftDayKey,
} from "@/lib/ops/schedule-rule-cleanup-window";
import {
  buildStripWeeks,
  defaultCutIndex,
  getCutDate,
  getStripMondays,
} from "@/components/ops/schedule-rules/rule-week-strip-model";
import { dayLabel, type BoardRule } from "@/components/ops/schedule-rules/schedule-rules-model";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { useRuleVisits } from "@/components/ops/schedule-rules/use-schedule-rules-queries";
import type { ScheduleRuleCleanupDirection } from "@/schemas/ops/schedule-rule-board";

// Estado de "Limpiar visitas" de un horario: sentido, semana de corte y si se
// ajusta la regla. Las cuentas usan todas las visitas de la regla, también las
// que quedan fuera de la tira.
export const useRuleCleanup = (ctrl: ScheduleRulesController, rule: BoardRule) => {
  const { todayKey } = ctrl;
  const { error, isLoading, visits } = useRuleVisits(rule.id);
  const [direction, setDirection] = useState<ScheduleRuleCleanupDirection>("FORWARD");
  const [cutIndex, setCutIndex] = useState(defaultCutIndex("FORWARD"));
  const [adjustRule, setAdjustRule] = useState(true);

  const cutDate = getCutDate(todayKey, direction, cutIndex);
  const weeks = buildStripWeeks(todayKey, visits, direction, cutIndex);
  const counts = countCleanup(visits, direction, cutDate, todayKey);
  const mondays = getStripMondays(todayKey);
  const stripStart = mondays[0];
  const stripEnd = shiftDayKey(mondays[mondays.length - 1], 6);
  const outside = visits.filter((visit) => {
    const key = dayKeyOf(visit.scheduledStartAt);
    return (key < stripStart || key > stripEnd) && isInsideCleanup(key, direction, cutDate) && isDeletableRuleVisit(visit);
  }).length;

  const changeDirection = (next: ScheduleRuleCleanupDirection) => {
    setDirection(next);
    setCutIndex(defaultCutIndex(next));
    setAdjustRule(next === "FORWARD");
  };

  const run = () => ctrl.mutations.cleanup({ adjustRule, cutDate, direction, rule }).catch(() => undefined);

  return {
    adjustLabel:
      direction === "FORWARD"
        ? `Terminar el horario el ${dayLabel(shiftDayKey(cutDate, -1))}`
        : `Mover el inicio del horario al ${dayLabel(shiftDayKey(cutDate, 1))}`,
    adjustRule,
    changeDirection,
    counts,
    direction,
    error,
    isLoading,
    isRunning: ctrl.mutations.isCleaning,
    outsideLabel: outside ? `${outside === 1 ? "Una queda" : `${outside} quedan`} fuera de las semanas que se ven.` : "",
    rangeLabel: direction === "FORWARD" ? `desde el lunes ${dayLabel(cutDate)}` : `hasta el domingo ${dayLabel(cutDate)}`,
    run,
    setAdjustRule,
    setCutIndex,
    weeks,
  };
};

export type RuleCleanupState = ReturnType<typeof useRuleCleanup>;
