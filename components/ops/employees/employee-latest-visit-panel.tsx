"use client";

import Link from "next/link";

import { dashboardPrimaryActionClass } from "@/components/dashboard/dashboard-styles";
import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const byScheduledAsc = (left: OpsOccurrence, right: OpsOccurrence) =>
  new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime();

const getLatestVisit = (occurrences: OpsOccurrence[]) => {
  const now = Date.now();
  const pastOccurrences = occurrences
    .filter((occurrence) => new Date(occurrence.scheduledStartAt).getTime() <= now)
    .sort(
      (left, right) =>
        new Date(right.scheduledStartAt).getTime() - new Date(left.scheduledStartAt).getTime()
    );

  if (pastOccurrences.length) {
    return pastOccurrences[0];
  }

  return [...occurrences].sort(byScheduledAsc)[0];
};

const hasRealTiming = (occurrence: OpsOccurrence) =>
  Boolean(occurrence.actualStartAt || occurrence.actualEndAt);

export const EmployeeLatestVisitPanel = ({
  employeeId,
  isLoading = false,
  occurrences,
}: {
  employeeId: string;
  isLoading?: boolean;
  occurrences: OpsOccurrence[];
}) => {
  const latestVisit = getLatestVisit(occurrences);

  return (
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-[#1A211A] dark:ring-white/10">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Ultima visita</CardTitle>
          <p className="text-sm text-muted-foreground">
            Resumen rapido de la visita mas reciente de la empleada.
          </p>
        </div>
        <Button asChild size="sm" className={dashboardPrimaryActionClass}>
          <Link href={`/dashboard/employees/${employeeId}/visits`}>Ver visitas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="min-h-32 animate-pulse rounded-2xl bg-muted/40" />
        ) : latestVisit ? (
          <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#242D23]">
            <div className="flex flex-wrap items-center gap-2">
              <OccurrenceStatusBadge status={latestVisit.status} />
              <span className="text-sm text-muted-foreground">
                {formatDate(latestVisit.scheduledStartAt)}
              </span>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Trabajo
                </p>
                <p className="font-medium">{latestVisit.job.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getOccurrenceEmployeesLabel(latestVisit)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Programado
                </p>
                <p className="font-medium">
                  {formatTime(latestVisit.scheduledStartAt)} -{" "}
                  {formatTime(latestVisit.scheduledEndAt)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Horario real
                </p>
                <p className="font-medium">
                  {hasRealTiming(latestVisit)
                    ? `${formatTime(latestVisit.actualStartAt)} - ${formatTime(latestVisit.actualEndAt)}`
                    : "Sin registrar"}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notas
              </p>
              <p className="text-muted-foreground">
                {latestVisit.notes || "Sin notas para esta visita."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavia no hay visitas para esta empleada.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
