"use client";

import { useMemo } from "react";

import { getScheduleWeek } from "@/lib/ops/schedule-week";
import { isAttentionVisit, summarizeVisitDays } from "@/lib/ops/visit-day";
import {
  filterCalendarOccurrences,
  type CalendarFilters,
} from "@/components/ops/calendar/calendar-filter-utils";
import { useEmployeeAvailability } from "@/components/ops/hooks/useEmployeeAvailability";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useVisitFilterOptions } from "@/components/ops/hooks/useVisitFilterOptions";
import { useOpsSelectedMonth } from "@/components/ops/shared";

// Las visitas del mes elegido, estiradas a semanas completas: la tira y el
// cronograma del celular muestran los dias del mes vecino con sus cuentas.
export const useVisitsData = (filters: CalendarFilters) => {
  const { monthKey, monthRange } = useOpsSelectedMonth();
  const range = useMemo(
    () => ({
      end: getScheduleWeek(monthRange.end).end,
      start: getScheduleWeek(monthRange.start).start,
    }),
    [monthRange.end, monthRange.start]
  );
  const query = useJobOccurrences(
    { endDate: range.end, includeArchived: false, startDate: range.start },
    `visits-${monthKey}`
  );
  const options = useVisitFilterOptions();
  const { employees: activeEmployees } = useEmployees({ isActive: true });
  const { rules } = useEmployeeAvailability();

  // "scoped" aplica trabajo, empleada y estado; "filtered" suma "solo
  // requieren atencion". Las cuentas de atencion se leen de scoped para que el
  // chip siga diciendo cuantas hay aunque el filtro este puesto.
  const scoped = useMemo(
    () => filterCalendarOccurrences(query.occurrences, { ...filters, attentionOnly: false }),
    [filters, query.occurrences]
  );
  const filtered = useMemo(
    () => (filters.attentionOnly ? scoped.filter(isAttentionVisit) : scoped),
    [filters.attentionOnly, scoped]
  );
  const employees = useMemo(
    () => activeEmployees.map((employee) => ({ id: employee.id, name: employee.name })),
    [activeEmployees]
  );
  const totals = useMemo(() => summarizeVisitDays(scoped), [scoped]);

  return {
    employeeOptions: options.employeeOptions.length ? options.employeeOptions : employees,
    employees,
    error: query.error,
    filtered,
    hasData: query.hasData,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    jobOptions: options.jobOptions,
    occurrences: query.occurrences,
    refetch: async () => {
      await options.refetch();
      return query.refetch();
    },
    rules,
    scoped,
    totals,
  };
};

export type VisitsData = ReturnType<typeof useVisitsData>;
