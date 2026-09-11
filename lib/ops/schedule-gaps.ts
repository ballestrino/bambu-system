import {
  getRangeMinutes,
  normalizeRanges,
  subtractRange,
  type MinuteRange,
} from "@/lib/ops/minute-ranges";
import {
  getAvailabilityWindows,
  groupAvailabilityRules,
  type ScheduleAvailabilityRule,
} from "@/lib/ops/schedule-availability";
import { getBusyRanges } from "@/lib/ops/schedule-conflicts";
import type { ScheduleDay, ScheduleEmployee } from "@/lib/ops/schedule-types";

export type ScheduleGap = MinuteRange & {
  dateKey: string;
  dayLabel: string;
  employeeId: string;
  employeeName: string;
  weekdayNumber: number;
};

export const DEFAULT_GAP_MINUTES = 120;

// El hueco es lo que queda de la disponibilidad del dia despues de sacar las
// visitas que ya ocupan a la empleada. Sin la disponibilidad, la grilla
// ofreceria las 03:00 de la madrugada como si fuera un hueco real.
export const getDayGaps = ({
  minimumMinutes,
  skipVisitId,
  visits,
  windows,
}: {
  minimumMinutes: number;
  skipVisitId?: string;
  visits: ScheduleDay["visits"];
  windows: MinuteRange[];
}): MinuteRange[] =>
  getBusyRanges(visits, skipVisitId)
    .reduce((free, busy) => subtractRange(free, busy), normalizeRanges(windows))
    .filter((gap) => getRangeMinutes(gap) >= minimumMinutes);

export const getEmployeeDayGaps = ({
  day,
  minimumMinutes,
  rules,
  skipVisitId,
}: {
  day: ScheduleDay;
  minimumMinutes: number;
  rules: ScheduleAvailabilityRule[];
  skipVisitId?: string;
}) =>
  getDayGaps({
    minimumMinutes,
    skipVisitId,
    visits: day.visits,
    windows: getAvailabilityWindows(rules, day.weekdayNumber),
  });

export const findScheduleGaps = ({
  employees,
  minimumMinutes = DEFAULT_GAP_MINUTES,
  rules,
  weekdays,
}: {
  employees: ScheduleEmployee[];
  minimumMinutes?: number;
  rules: ScheduleAvailabilityRule[];
  weekdays?: number[];
}): ScheduleGap[] => {
  const rulesByEmployee = groupAvailabilityRules(rules);

  const gaps = employees.flatMap((employee) =>
    employee.days
      .filter((day) => !weekdays || weekdays.includes(day.weekdayNumber))
      .flatMap((day) =>
        getEmployeeDayGaps({
          day,
          minimumMinutes,
          rules: rulesByEmployee.get(employee.id) ?? [],
        }).map((gap) => ({
          ...gap,
          dateKey: day.dateKey,
          dayLabel: day.longLabel,
          employeeId: employee.id,
          employeeName: employee.name,
          weekdayNumber: day.weekdayNumber,
        }))
      )
  );

  return gaps.sort(
    (left, right) =>
      left.dateKey.localeCompare(right.dateKey) ||
      left.startMinute - right.startMinute ||
      left.employeeName.localeCompare(right.employeeName, "es")
  );
};
