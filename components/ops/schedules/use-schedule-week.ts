"use client";

import { useMemo, useState } from "react";

import { buildWeeklySchedule } from "@/lib/ops/schedule-mapper";
import { getScheduleWeek, parseScheduleWeekParam } from "@/lib/ops/schedule-week";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { ALL_WEEKDAYS } from "@/components/ops/schedules/schedule-weekday-filter";
import { useOpsPersistedState } from "@/components/ops/shared";

const defaultWeekdayState = { weekdays: ALL_WEEKDAYS };

export const useScheduleWeek = () => {
  const [weekStart, setWeekStart] = useState(
    () => getScheduleWeek(new Date()).startKey
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [weekdayState, setWeekdayState] = useOpsPersistedState(
    "bambu:ops:schedule:weekdays",
    defaultWeekdayState
  );
  const visibleWeekdays = weekdayState.weekdays?.length
    ? weekdayState.weekdays
    : ALL_WEEKDAYS;

  const week = useMemo(
    () => getScheduleWeek(parseScheduleWeekParam(weekStart)),
    [weekStart]
  );
  // Comparte cache y actualizaciones optimistas con el resto de Visitas.
  const occurrencesQuery = useJobOccurrences(
    { endDate: week.end, includeArchived: false, startDate: week.start },
    `schedule-${week.startKey}`
  );
  const { employees } = useEmployees({ isActive: true });

  const visibleEmployees = useMemo(() => {
    const active = employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
    }));

    return selectedEmployeeIds.length
      ? active.filter((employee) => selectedEmployeeIds.includes(employee.id))
      : active;
  }, [employees, selectedEmployeeIds]);

  const schedule = useMemo(
    () =>
      buildWeeklySchedule({
        employees: visibleEmployees,
        generatedAt: new Date(),
        occurrences: occurrencesQuery.occurrences,
        week,
      }),
    [occurrencesQuery.occurrences, visibleEmployees, week]
  );

  return {
    employeeOptions: employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
    })),
    error: occurrencesQuery.error,
    isLoading: occurrencesQuery.isLoading,
    occurrences: occurrencesQuery.occurrences,
    refetch: occurrencesQuery.refetch,
    schedule,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    setVisibleWeekdays: (weekdays: number[]) => setWeekdayState({ weekdays }),
    setWeekStart,
    visibleWeekdays,
    week,
    weekStart,
  };
};
