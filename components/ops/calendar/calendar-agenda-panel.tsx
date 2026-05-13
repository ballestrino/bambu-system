import Link from "next/link";
import { AlertCircle, BriefcaseBusiness, UserRound } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import {
  getCalendarStats,
  getVisitActionLabel,
} from "@/components/ops/calendar/calendar-utils";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { OpsEmptyState, opsSurface } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CalendarAgendaItem = ({ occurrence }: { occurrence: OpsOccurrence }) => (
  <article className="rounded-md border border-[#53985E]/15 bg-white p-4 shadow-sm shadow-[#244C2D]/5 dark:bg-[#132016]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <OccurrenceStatusBadge status={occurrence.status} />
          <span className="rounded-full bg-[#F7FBF7] px-3 py-1 text-xs font-medium text-[#244C2D] dark:bg-[#53985E]/15 dark:text-[#A7D8AE]">
            {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-[#18251D] dark:text-[#EAF5EC]">
            {occurrence.job.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" />
            {occurrence.employee?.name ?? "Sin empleada asignada"}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Plan {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}</span>
          <span>Real {formatTime(occurrence.actualStartAt)} - {formatTime(occurrence.actualEndAt)}</span>
          <span>{occurrence.isDetached ? "Separada de regla" : "Ligada a regla"}</span>
        </div>
        {occurrence.notes ? (
          <p className="text-sm text-muted-foreground">{occurrence.notes}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
          <Link href={`/dashboard/jobs/${occurrence.jobId}`}>
            <BriefcaseBusiness className="h-4 w-4" />
            Trabajo
          </Link>
        </Button>
        <JobOccurrenceDialog
          occurrence={occurrence}
          triggerLabel={getVisitActionLabel(occurrence)}
        />
      </div>
    </div>
  </article>
);

export const CalendarAgendaPanel = ({
  allOccurrences,
  isLoading,
  occurrences,
  selectedDate,
}: {
  allOccurrences: OpsOccurrence[];
  isLoading: boolean;
  occurrences: OpsOccurrence[];
  selectedDate?: Date;
}) => {
  const { needsAttentionCount } = getCalendarStats(allOccurrences);

  return (
    <section className={cn(opsSurface.panel, "p-4 md:p-5")}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#18251D] dark:text-[#EAF5EC]">
            Agenda del {selectedDate ? formatDate(selectedDate) : "día seleccionado"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {occurrences.length} visita(s) en el día · {needsAttentionCount} requieren atención este mes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-56 animate-pulse rounded-md bg-muted/40" />
      ) : occurrences.length ? (
        <div className="space-y-3">
          {occurrences.map((occurrence) => (
            <CalendarAgendaItem key={occurrence.id} occurrence={occurrence} />
          ))}
        </div>
      ) : (
        <OpsEmptyState
          icon={AlertCircle}
          title="No hay visitas para este día"
          description="Crea una visita manual o cambia de día para revisar la agenda."
          action={<JobOccurrenceDialog triggerLabel="Nueva visita" />}
        />
      )}
    </section>
  );
};
