"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, CalendarCheck2, ChevronDown } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import {
  getPendingRegistrationVisits,
  getTomorrowScheduledVisits,
} from "@/components/ops/jobs/pending-visits-utils";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import { opsSurface } from "@/components/ops/shared";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingVisitsMode = "pending" | "tomorrow";

export const PendingVisitsPanel = ({
  countLabel,
  defaultOpen = true,
  description = "Revisá equipo, horario real y notas para dejar estas visitas listas para pagos.",
  emptyMessage = "No hay visitas pendientes de registro.",
  isLoading = false,
  mode = "pending",
  occurrences,
  scheduleRules = [],
  showJobLink = false,
  title = "Visitas pendientes de registro",
}: {
  countLabel?: string;
  defaultOpen?: boolean;
  description?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  mode?: PendingVisitsMode;
  occurrences: OpsOccurrence[];
  scheduleRules?: OpsScheduleRule[];
  showJobLink?: boolean;
  title?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const visits =
    mode === "tomorrow"
      ? getTomorrowScheduledVisits(occurrences)
      : getPendingRegistrationVisits(occurrences);
  const actionLabel = mode === "tomorrow" ? "Editar" : "Registrar";
  const resolvedCountLabel =
    countLabel ?? (mode === "tomorrow" ? "visita(s)" : "pendiente(s)");

  return (
    <section className={cn(opsSurface.panel, "overflow-hidden")}>
      <button
        type="button"
        className="flex w-full flex-col gap-3 p-4 text-left md:flex-row md:items-center md:justify-between md:p-5"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-300/60 dark:bg-amber-500/15 dark:text-amber-200">
            <CalendarCheck2 className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#53985E]">
              Siguiente acción
            </span>
            <span className="block text-base font-semibold text-[#18251D] dark:text-[#EAF5EC]">
              {title}
            </span>
            <span className="block text-sm text-muted-foreground">{description}</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-sm font-medium text-[#244C2D] dark:text-[#A7D8AE]">
          {isLoading ? "Cargando" : `${visits.length} ${resolvedCountLabel}`}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </span>
      </button>

      {isOpen ? (
        <div className="space-y-3 border-t border-[#53985E]/15 p-4 md:p-5">
          {isLoading ? (
            <div className="min-h-32 animate-pulse rounded-md bg-muted/40" />
          ) : visits.length ? (
            visits.map((occurrence) => {
              const occurrenceRules = scheduleRules.filter(
                (rule) => rule.jobId === occurrence.jobId
              );

              return (
                <article key={occurrence.id} className="rounded-md border border-[#53985E]/15 bg-white p-4 shadow-sm shadow-[#244C2D]/5 dark:bg-[#132016]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <OccurrenceStatusBadge status={occurrence.status} />
                        <span className="rounded-full bg-[#F7FBF7] px-3 py-1 text-xs font-medium text-[#244C2D] dark:bg-[#53985E]/15 dark:text-[#A7D8AE]">
                          {formatDate(occurrence.scheduledStartAt)}
                        </span>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trabajo</p>
                          <p className="font-medium">{occurrence.job.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Equipo</p>
                          <p className="font-medium">{getOccurrenceEmployeesLabel(occurrence)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Programado</p>
                          <p className="font-medium">{formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {showJobLink ? (
                        <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                          <Link href={`/dashboard/jobs/${occurrence.jobId}`}>
                            <BriefcaseBusiness className="h-4 w-4" />
                            Trabajo
                          </Link>
                        </Button>
                      ) : null}
                      <JobOccurrenceDialog
                        completeOnSave={mode === "pending"}
                        occurrence={occurrence}
                        scheduleRules={occurrenceRules}
                        triggerLabel={actionLabel}
                      />
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </section>
  );
};
