"use client";

import { useMemo, useState } from "react";

import { CalendarAgendaPanel } from "@/components/ops/calendar/calendar-agenda-panel";
import {
  DEFAULT_CALENDAR_FILTERS,
  filterCalendarOccurrences,
  getCalendarFilterOptions,
  hasActiveCalendarFilters,
  type CalendarFilters,
} from "@/components/ops/calendar/calendar-filter-utils";
import { CalendarFiltersBar } from "@/components/ops/calendar/calendar-filters";
import {
  byScheduledStart,
  sameDay,
} from "@/components/ops/calendar/calendar-utils";
import { CalendarMonthPanel } from "@/components/ops/calendar/calendar-month-panel";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import {
  OpsPageHeader,
  OpsPageShell,
  OpsRefreshButton,
  useOpsSelectedMonth,
} from "@/components/ops/shared";

export const CalendarPage = () => {
  const { month, monthKey, monthRange, setMonth } = useOpsSelectedMonth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [filterSession, setFilterSession] = useState({
    filters: { ...DEFAULT_CALENDAR_FILTERS },
    monthKey,
  });
  const filters =
    filterSession.monthKey === monthKey
      ? filterSession.filters
      : DEFAULT_CALENDAR_FILTERS;
  const visibleSelectedDate =
    selectedDate &&
    selectedDate.getFullYear() === month.getFullYear() &&
    selectedDate.getMonth() === month.getMonth()
      ? selectedDate
      : monthRange.start;
  const {
    occurrences,
    isFetching,
    isLoading,
    refetch,
  } = useJobOccurrences(
    {
      startDate: monthRange.start,
      endDate: monthRange.end,
      includeArchived: false,
    },
    monthKey
  );

  const { employeeOptions, jobOptions } = useMemo(
    () => getCalendarFilterOptions(occurrences),
    [occurrences]
  );
  const filteredOccurrences = useMemo(
    () => filterCalendarOccurrences(occurrences, filters),
    [filters, occurrences]
  );
  const selectedDayOccurrences = useMemo(
    () =>
      filteredOccurrences
        .filter((occurrence) =>
          sameDay(occurrence.scheduledStartAt, visibleSelectedDate)
        )
        .sort(byScheduledStart),
    [filteredOccurrences, visibleSelectedDate]
  );
  const clearFilters = () =>
    setFilterSession({
      filters: { ...DEFAULT_CALENDAR_FILTERS },
      monthKey,
    });
  const updateFilters = (changes: Partial<CalendarFilters>) =>
    setFilterSession((current) => ({
      filters: {
        ...(current.monthKey === monthKey
          ? current.filters
          : DEFAULT_CALENDAR_FILTERS),
        ...changes,
      },
      monthKey,
    }));
  const hasActiveFilters = hasActiveCalendarFilters(filters);

  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Operaciones"
        title="Calendario"
        description="Agenda diaria de visitas, asignaciones y horarios reales."
        actions={
          <>
            <OpsRefreshButton isRefreshing={isFetching} onRefresh={refetch} />
            <JobOccurrenceDialog triggerLabel="Nueva visita" />
          </>
        }
      />

      <CalendarFiltersBar
        employeeOptions={employeeOptions}
        filters={filters}
        jobOptions={jobOptions}
        onChange={updateFilters}
        onClear={clearFilters}
        totalCount={occurrences.length}
        visibleCount={filteredOccurrences.length}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
        <CalendarMonthPanel
          month={month}
          occurrences={filteredOccurrences}
          selectedDate={visibleSelectedDate}
          onMonthChange={setMonth}
          onSelectDate={setSelectedDate}
        />
        <CalendarAgendaPanel
          allOccurrences={filteredOccurrences}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          occurrences={selectedDayOccurrences}
          onClearFilters={clearFilters}
          selectedDate={visibleSelectedDate}
        />
      </div>
    </OpsPageShell>
  );
};
