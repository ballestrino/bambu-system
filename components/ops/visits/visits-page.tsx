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
import { CalendarMonthPanel } from "@/components/ops/calendar/calendar-month-panel";
import { byScheduledStart, sameDay } from "@/components/ops/calendar/calendar-utils";
import { useInfiniteVisits } from "@/components/ops/hooks/useInfiniteVisits";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useVisitFilterOptions } from "@/components/ops/hooks/useVisitFilterOptions";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import {
  OpsPageHeader,
  OpsPageShell,
  OpsRefreshButton,
  useOpsPersistedState,
  useOpsSelectedMonth,
} from "@/components/ops/shared";
import { VisitFeed } from "@/components/ops/visits/visit-feed";
import {
  isVisitView,
  VisitViewSwitcher,
  type VisitView,
} from "@/components/ops/visits/visit-view-switcher";
import { getVisitExactDateAnchor, getVisitFeedAnchor } from "@/lib/ops/visit-feed";

const defaultViewState = { view: "calendar" as VisitView };
const mergeOptions = <T extends { id: string; name: string }>(
  primary: T[],
  fallback: T[]
) => Array.from(new Map([...primary, ...fallback].map((item) => [item.id, item])).values());

export const VisitsPage = () => {
  const { month, monthKey, monthRange, setMonth } = useOpsSelectedMonth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [viewState, setViewState] = useOpsPersistedState(
    "bambu:ops:visits:view",
    defaultViewState
  );
  const [filterSession, setFilterSession] = useState({
    exactDate: "",
    filters: { ...DEFAULT_CALENDAR_FILTERS },
    monthKey,
  });
  const view = isVisitView(viewState.view) ? viewState.view : "calendar";
  const filters = filterSession.monthKey === monthKey
    ? filterSession.filters
    : DEFAULT_CALENDAR_FILTERS;
  const exactDate = filterSession.monthKey === monthKey ? filterSession.exactDate : "";
  const visibleSelectedDate = selectedDate &&
    selectedDate.getFullYear() === month.getFullYear() &&
    selectedDate.getMonth() === month.getMonth()
      ? selectedDate
      : monthRange.start;
  const calendarQuery = useJobOccurrences({
    endDate: monthRange.end,
    includeArchived: false,
    startDate: monthRange.start,
  }, monthKey);
  const filterOptionsQuery = useVisitFilterOptions();
  const fallbackOptions = useMemo(
    () => getCalendarFilterOptions(calendarQuery.occurrences),
    [calendarQuery.occurrences]
  );
  const employeeOptions = mergeOptions(
    filterOptionsQuery.employeeOptions,
    fallbackOptions.employeeOptions
  );
  const jobOptions = mergeOptions(filterOptionsQuery.jobOptions, fallbackOptions.jobOptions);
  const filteredOccurrences = useMemo(
    () => filterCalendarOccurrences(calendarQuery.occurrences, filters),
    [calendarQuery.occurrences, filters]
  );
  const selectedDayOccurrences = useMemo(
    () => filteredOccurrences
      .filter((occurrence) => sameDay(occurrence.scheduledStartAt, visibleSelectedDate))
      .sort(byScheduledStart),
    [filteredOccurrences, visibleSelectedDate]
  );
  const anchor = useMemo(() => {
    if (exactDate) return getVisitExactDateAnchor(exactDate);
    const [year, monthNumber] = monthKey.split("-").map(Number);
    return getVisitFeedAnchor(new Date(year, monthNumber - 1, 1));
  }, [exactDate, monthKey]);
  const feedQuery = useInfiniteVisits({
    anchor,
    enabled: view !== "calendar",
    filters: { ...filters, exactDate: exactDate || undefined },
  });

  const clearFilters = () => setFilterSession({
    exactDate: "",
    filters: { ...DEFAULT_CALENDAR_FILTERS },
    monthKey,
  });
  const updateFilters = (changes: Partial<CalendarFilters>) =>
    setFilterSession((current) => ({
      exactDate: current.monthKey === monthKey ? current.exactDate : "",
      filters: {
        ...(current.monthKey === monthKey ? current.filters : DEFAULT_CALENDAR_FILTERS),
        ...changes,
      },
      monthKey,
    }));
  const updateExactDate = (nextDate: string) =>
    setFilterSession((current) => ({
      exactDate: nextDate,
      filters: current.monthKey === monthKey ? current.filters : { ...DEFAULT_CALENDAR_FILTERS },
      monthKey,
    }));
  const isCalendar = view === "calendar";
  const refresh = async () => {
    await filterOptionsQuery.refetch();
    return isCalendar ? calendarQuery.refetch() : feedQuery.refetch();
  };

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={<><OpsRefreshButton isRefreshing={isCalendar ? calendarQuery.isFetching : feedQuery.isFetching} onRefresh={refresh} /><JobOccurrenceDialog triggerLabel="Nueva visita" /></>}
        description="Calendario e historial operativo de visitas, asignaciones y horarios reales."
        eyebrow="Operaciones"
        title="Visitas"
      />
      <VisitViewSwitcher
        onChange={(nextView) => setViewState({ view: nextView })}
        value={view}
      />
      <CalendarFiltersBar
        countLabel={isCalendar ? undefined : `${feedQuery.occurrences.length} visita(s) cargadas`}
        employeeOptions={employeeOptions}
        exactDate={isCalendar ? undefined : exactDate}
        filters={filters}
        jobOptions={jobOptions}
        onChange={updateFilters}
        onClear={clearFilters}
        onExactDateChange={isCalendar ? undefined : updateExactDate}
        totalCount={calendarQuery.occurrences.length}
        visibleCount={isCalendar ? filteredOccurrences.length : feedQuery.occurrences.length}
      />

      {isCalendar ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
          <CalendarMonthPanel month={month} occurrences={filteredOccurrences} selectedDate={visibleSelectedDate} onMonthChange={setMonth} onSelectDate={setSelectedDate} />
          <CalendarAgendaPanel allOccurrences={filteredOccurrences} hasActiveFilters={hasActiveCalendarFilters(filters)} isLoading={calendarQuery.isLoading} occurrences={selectedDayOccurrences} onClearFilters={clearFilters} selectedDate={visibleSelectedDate} />
        </div>
      ) : (
        <VisitFeed
          error={feedQuery.error}
          fetchNextPage={feedQuery.fetchNextPage}
          hasNextPage={feedQuery.hasNextPage}
          isFetchingNextPage={feedQuery.isFetchingNextPage}
          isLoading={feedQuery.isLoading}
          pages={feedQuery.pages}
          refetch={feedQuery.refetch}
          view={view}
        />
      )}
    </OpsPageShell>
  );
};
