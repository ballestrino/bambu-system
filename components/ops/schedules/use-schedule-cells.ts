"use client";

import { useMemo } from "react";

import type { MinuteRange } from "@/lib/ops/minute-ranges";
import {
  getAvailabilityWindows,
  groupAvailabilityRules,
  type ScheduleAvailabilityRule,
} from "@/lib/ops/schedule-availability";
import { countOverlapPairs } from "@/lib/ops/schedule-conflicts";
import { getDayGaps } from "@/lib/ops/schedule-gaps";
import type { WeeklySchedule } from "@/lib/ops/schedule-types";
import { getDayWarnings, type ScheduleWarnings } from "@/lib/ops/schedule-warnings";
import type { ScheduleDragPayload } from "@/components/ops/schedules/use-schedule-drag";

export type ScheduleCellState = {
  dropSlots: MinuteRange[];
  isUnavailable: boolean;
  warnings: ScheduleWarnings;
};

const EMPTY_CELL: ScheduleCellState = {
  dropSlots: [],
  isUnavailable: false,
  warnings: new Map(),
};

const getCellKey = (employeeId: string | null, dateKey: string) =>
  `${employeeId ?? ""}:${dateKey}`;

// Avisos, huecos y dias sin disponibilidad se calculan una vez por semana y no
// por celda renderizada: la grilla vuelve a dibujarse en cada movimiento del
// arrastre.
export const useScheduleCells = ({
  dragging,
  rules,
  schedule,
  visibleWeekdays,
}: {
  dragging: ScheduleDragPayload | null;
  rules: ScheduleAvailabilityRule[];
  schedule: WeeklySchedule;
  visibleWeekdays: number[];
}) => {
  const cells = useMemo(() => {
    const rulesByEmployee = groupAvailabilityRules(rules);
    const state = new Map<string, ScheduleCellState>();

    schedule.employees.forEach((employee) => {
      const employeeRules = rulesByEmployee.get(employee.id) ?? [];

      employee.days.forEach((day) => {
        const windows = getAvailabilityWindows(employeeRules, day.weekdayNumber);

        state.set(getCellKey(employee.id, day.dateKey), {
          dropSlots: dragging
            ? getDayGaps({
                minimumMinutes: dragging.durationMinutes,
                skipVisitId: dragging.visitId,
                visits: day.visits,
                windows,
              })
            : [],
          isUnavailable: employeeRules.length > 0 && !windows.length,
          warnings: getDayWarnings({ day, rules: employeeRules }),
        });
      });
    });

    return state;
  }, [dragging, rules, schedule]);

  const overlapCount = useMemo(
    () =>
      schedule.employees.reduce(
        (total, employee) =>
          total +
          countOverlapPairs(
            employee.days.filter((day) => visibleWeekdays.includes(day.weekdayNumber))
          ),
        0
      ),
    [schedule, visibleWeekdays]
  );

  return {
    getCellState: (employeeId: string | null, dateKey: string) =>
      cells.get(getCellKey(employeeId, dateKey)) ?? EMPTY_CELL,
    overlapCount,
  };
};

export type ScheduleCellReader = ReturnType<typeof useScheduleCells>["getCellState"];
