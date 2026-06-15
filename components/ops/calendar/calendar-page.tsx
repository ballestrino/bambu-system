"use client";

import { useMemo, useState } from "react";

import { CalendarAgendaPanel } from "@/components/ops/calendar/calendar-agenda-panel";
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

  const selectedDayOccurrences = useMemo(
    () =>
      occurrences
        .filter((occurrence) =>
          sameDay(occurrence.scheduledStartAt, visibleSelectedDate)
        )
        .sort(byScheduledStart),
    [occurrences, visibleSelectedDate]
  );

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
        <CalendarMonthPanel
          month={month}
          occurrences={occurrences}
          selectedDate={visibleSelectedDate}
          onMonthChange={setMonth}
          onSelectDate={setSelectedDate}
        />
        <CalendarAgendaPanel
          allOccurrences={occurrences}
          isLoading={isLoading}
          occurrences={selectedDayOccurrences}
          selectedDate={visibleSelectedDate}
        />
      </div>
    </OpsPageShell>
  );
};
