import Link from "next/link";
import { AlertCircle, AlertTriangle, BriefcaseBusiness, Clock3, UsersRound } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import {
  getCalendarStats,
  getVisitActionLabel,
  groupOccurrencesByHour,
  needsOccurrenceAttention,
  shouldCompleteOccurrenceOnSave,
  type CalendarHourGroup,
} from "@/components/ops/calendar/calendar-utils";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { OpsEmptyState, opsSurface } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CalendarAgendaItem = ({ occurrence }: { occurrence: OpsOccurrence }) => (
  <article className="rounded-[var(--ops-radius-row)] border border-ops-border bg-ops-surface p-3 shadow-sm shadow-ops-bamboo-strong/5 transition-colors hover:border-ops-bamboo/40 sm:p-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ops-bamboo-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-ops-bamboo-strong">
            {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
          </span>
          <OccurrenceStatusBadge status={occurrence.status} />
          {needsOccurrenceAttention(occurrence) ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              Requiere atención
            </span>
          ) : null}
        </div>
        <h3 className="truncate font-semibold text-ops-text">{occurrence.job.name}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ops-text-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{getOccurrenceEmployeesLabel(occurrence)}</span>
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            Real {formatTime(occurrence.actualStartAt)} - {formatTime(occurrence.actualEndAt)}
          </span>
          <span>{occurrence.isDetached ? "Separada de regla" : "Ligada a regla"}</span>
        </div>
        {occurrence.notes ? (
          <p className="text-sm text-ops-text-muted">{occurrence.notes}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
        <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
          <Link href={`/dashboard/jobs/${occurrence.jobId}`}>
            <BriefcaseBusiness className="h-4 w-4" />
            Trabajo
          </Link>
        </Button>
        <JobOccurrenceDialog
          completeOnSave={shouldCompleteOccurrenceOnSave(occurrence)}
          occurrence={occurrence}
          triggerLabel={getVisitActionLabel(occurrence)}
        />
      </div>
    </div>
  </article>
);

const CalendarAgendaHourGroup = ({
  group,
  isLast,
}: {
  group: CalendarHourGroup;
  isLast: boolean;
}) => (
  <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-4">
    <div className="pt-2 text-right">
      <p className="text-sm font-semibold tabular-nums leading-none text-ops-text">
        {group.label}
      </p>
      <p className="mt-1 text-[11px] leading-none text-ops-text-muted">
        {group.occurrences.length} visita{group.occurrences.length === 1 ? "" : "s"}
      </p>
    </div>
    <div
      className={cn(
        "relative space-y-3 border-l border-ops-border pl-4 sm:pl-5",
        isLast ? "pb-1" : "pb-5"
      )}
    >
      <span
        aria-hidden
        className="absolute -left-[5px] top-3 h-2.5 w-2.5 rounded-full bg-ops-bamboo ring-4 ring-ops-surface"
      />
      {group.occurrences.map((occurrence) => (
        <CalendarAgendaItem key={occurrence.id} occurrence={occurrence} />
      ))}
    </div>
  </div>
);

export const CalendarAgendaPanel = ({
  allOccurrences,
  hasActiveFilters,
  isLoading,
  occurrences,
  onClearFilters,
  selectedDate,
}: {
  allOccurrences: OpsOccurrence[];
  hasActiveFilters: boolean;
  isLoading: boolean;
  occurrences: OpsOccurrence[];
  onClearFilters: () => void;
  selectedDate?: Date;
}) => {
  const { needsAttentionCount } = getCalendarStats(allOccurrences);
  const hourGroups = groupOccurrencesByHour(occurrences);

  return (
    <section className={cn(opsSurface.panel, "p-4 md:p-5")}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ops-text">
            Agenda del {selectedDate ? formatDate(selectedDate) : "día seleccionado"}
          </h2>
          <p className="text-sm text-ops-text-muted">
            {occurrences.length} visita(s) en el día · {needsAttentionCount} requieren atención este mes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-56 animate-pulse rounded-md bg-muted/40" />
      ) : hourGroups.length ? (
        <div>
          {hourGroups.map((group, index) => (
            <CalendarAgendaHourGroup
              group={group}
              isLast={index === hourGroups.length - 1}
              key={group.hour}
            />
          ))}
        </div>
      ) : (
        <OpsEmptyState
          icon={AlertCircle}
          title={
            hasActiveFilters
              ? "No hay visitas que coincidan"
              : "No hay visitas para este día"
          }
          description={
            hasActiveFilters
              ? "Quita algún filtro o selecciona otro día para ampliar la agenda."
              : "Crea una visita manual o cambia de día para revisar la agenda."
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={onClearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <JobOccurrenceDialog triggerLabel="Nueva visita" />
            )
          }
        />
      )}
    </section>
  );
};
