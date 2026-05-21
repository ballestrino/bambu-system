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
import { getMonthKey, getMonthRange } from "@/components/ops/utils";
import { OpsPageHeader, OpsPageShell, OpsRefreshButton } from "@/components/ops/shared";

export const CalendarPage = () => {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const monthRange = getMonthRange(month);
  const monthKey = getMonthKey(month);
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
        .filter((occurrence) => sameDay(occurrence.scheduledStartAt, selectedDate))
        .sort(byScheduledStart),
    [occurrences, selectedDate]
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
          selectedDate={selectedDate}
          onMonthChange={setMonth}
          onSelectDate={setSelectedDate}
        />
        <CalendarAgendaPanel
          allOccurrences={occurrences}
          isLoading={isLoading}
          occurrences={selectedDayOccurrences}
          selectedDate={selectedDate}
        />
      </div>
    </OpsPageShell>
  );
};
