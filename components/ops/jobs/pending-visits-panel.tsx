"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, CalendarCheck2, ChevronDown } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import { opsSurface } from "@/components/ops/shared";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const byScheduledStart = (left: OpsOccurrence, right: OpsOccurrence) =>
  new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime();

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isTodayOrPast = (date: Date | string) =>
  startOfDay(new Date(date)).getTime() <= startOfDay(new Date()).getTime();

const needsRegistration = (occurrence: OpsOccurrence) =>
  occurrence.status === "SCHEDULED" &&
  isTodayOrPast(occurrence.scheduledStartAt) &&
  (!occurrence.actualStartAt || !occurrence.actualEndAt);

export const PendingVisitsPanel = ({
  defaultOpen = true,
  description = "Revisá responsable, horario real y notas para dejar estas visitas listas para pagos.",
  emptyMessage = "No hay visitas pendientes de registro.",
  occurrences,
  scheduleRules = [],
  showJobLink = false,
  title = "Visitas pendientes de registro",
}: {
  defaultOpen?: boolean;
  description?: string;
  emptyMessage?: string;
  occurrences: OpsOccurrence[];
  scheduleRules?: OpsScheduleRule[];
  showJobLink?: boolean;
  title?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pendingVisits = occurrences.filter(needsRegistration).sort(byScheduledStart);

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
              Siguiente accion
            </span>
            <span className="block text-base font-semibold text-[#18251D] dark:text-[#EAF5EC]">
              {title}
            </span>
            <span className="block text-sm text-muted-foreground">{description}</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-sm font-medium text-[#244C2D] dark:text-[#A7D8AE]">
          {pendingVisits.length} pendiente(s)
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </span>
      </button>

      {isOpen ? (
        <div className="space-y-3 border-t border-[#53985E]/15 p-4 md:p-5">
          {pendingVisits.length ? (
            pendingVisits.map((occurrence) => (
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
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Empleada</p>
                        <p className="font-medium">{occurrence.employee?.name ?? "Sin empleada asignada"}</p>
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
                      occurrence={occurrence}
                      scheduleRules={scheduleRules}
                      triggerLabel="Registrar"
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </section>
  );
};
