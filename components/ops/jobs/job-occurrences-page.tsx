"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { JobOccurrenceFilters } from "@/components/ops/jobs/job-occurrence-filters";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { JobOccurrencesPanel } from "@/components/ops/jobs/job-occurrences-panel";
import {
  getLastWeekRange,
  getMonthRangeValues,
  getOccurrenceEmployeeOptions,
} from "@/components/ops/jobs/job-occurrence-page-utils";
import { useJob } from "@/components/ops/hooks/useJob";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";
import { toDateInputValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const JobOccurrencesPage = ({ jobId }: { jobId: string }) => {
  const currentMonth = getMonthRangeValues(new Date());
  const [startDate, setStartDate] = useState(currentMonth.startDate);
  const [endDate, setEndDate] = useState(currentMonth.endDate);
  const [employeeId, setEmployeeId] = useState("ALL");
  const { job, isLoading, error } = useJob(jobId);
  const { scheduleRules } = useJobScheduleRules({ jobId });
  const { archiveOccurrenceAsync, detachOccurrenceAsync } = useJobOccurrenceMutations(jobId);
  const { occurrences: allOccurrences } = useJobOccurrences(
    { includeArchived: false, jobId },
    `job-occurrence-employees-${jobId}`
  );
  const employeeOptions = useMemo(
    () => getOccurrenceEmployeeOptions(allOccurrences),
    [allOccurrences]
  );
  const resolvedEmployeeId = employeeOptions.some((employee) => employee.id === employeeId)
    ? employeeId
    : "ALL";
  const filters = {
    employeeId: resolvedEmployeeId === "ALL" ? undefined : resolvedEmployeeId,
    endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
    includeArchived: false,
    jobId,
    startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
  };
  const {
    occurrences,
    isLoading: areOccurrencesLoading,
  } = useJobOccurrences(
    filters,
    `job-occurrences-${jobId}-${resolvedEmployeeId}-${startDate}-${endDate}`
  );

  const activePreset = useMemo(() => {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const lastWeek = getLastWeekRange();
    const previousMonthRange = getMonthRangeValues(previousMonth);
    const lastWeekRange = {
      endDate: toDateInputValue(lastWeek.end),
      startDate: toDateInputValue(lastWeek.start),
    };

    if (
      startDate === currentMonth.startDate &&
      endDate === currentMonth.endDate
    ) {
      return "current-month";
    }

    if (
      startDate === previousMonthRange.startDate &&
      endDate === previousMonthRange.endDate
    ) {
      return "previous-month";
    }

    if (startDate === lastWeekRange.startDate && endDate === lastWeekRange.endDate) {
      return "last-week";
    }

    return null;
  }, [currentMonth.endDate, currentMonth.startDate, endDate, startDate]);

  const monthReference = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const monthLabel = monthReference.toLocaleDateString("es-UY", {
    month: "long",
    year: "numeric",
  });
  const emptyMessage = allOccurrences.length
    ? "No hay ocurrencias para estos filtros."
    : "Todavía no hay ocurrencias para este trabajo.";

  const setMonthDates = (month: Date) => {
    const nextRange = getMonthRangeValues(month);
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
  };

  if (isLoading) {
    return <div className="container w-full animate-pulse rounded-lg bg-muted/40 p-20" />;
  }

  if (error || !job) {
    return (
      <Card className="container w-full border-dashed">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No pudimos cargar las ocurrencias</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Operaciones"
        title={`Ocurrencias de ${job.name}`}
        description="Agenda completa del trabajo con visitas pasadas, pendientes y acciones operativas."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/jobs/${jobId}`}>Volver al trabajo</Link>
            </Button>
            <JobOccurrenceDialog jobId={jobId} scheduleRules={scheduleRules} />
          </>
        }
      />

      <JobOccurrenceFilters
        activePreset={activePreset}
        employeeId={resolvedEmployeeId}
        employeeOptions={employeeOptions}
        endDate={endDate}
        monthLabel={monthLabel}
        onClear={() => {
          setEmployeeId("ALL");
          setMonthDates(new Date());
        }}
        onEmployeeIdChange={setEmployeeId}
        onEndDateChange={setEndDate}
        onNextMonth={() => {
          setMonthDates(
            new Date(monthReference.getFullYear(), monthReference.getMonth() + 1, 1)
          );
        }}
        onPresetCurrentMonth={() => {
          setMonthDates(new Date());
        }}
        onPresetLastWeek={() => {
          const lastWeek = getLastWeekRange();
          setStartDate(toDateInputValue(lastWeek.start));
          setEndDate(toDateInputValue(lastWeek.end));
        }}
        onPresetPreviousMonth={() => {
          setMonthDates(
            new Date(monthReference.getFullYear(), monthReference.getMonth() - 1, 1)
          );
        }}
        onPreviousMonth={() => {
          setMonthDates(
            new Date(monthReference.getFullYear(), monthReference.getMonth() - 1, 1)
          );
        }}
        onStartDateChange={setStartDate}
        startDate={startDate}
        totalVisible={occurrences.length}
      />

      <JobOccurrencesPanel
        emptyMessage={emptyMessage}
        isLoading={areOccurrencesLoading}
        jobId={jobId}
        scheduleRules={scheduleRules}
        occurrences={occurrences}
        onArchive={async (occurrenceId) => {
          await archiveOccurrenceAsync(occurrenceId);
        }}
        onDetach={async (args) => {
          await detachOccurrenceAsync(args);
        }}
      />
    </OpsPageShell>
  );
};
