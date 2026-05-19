"use client";

import Link from "next/link";

import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const byScheduledAsc = (left: OpsOccurrence, right: OpsOccurrence) =>
  new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime();

const getLatestOccurrence = (occurrences: OpsOccurrence[]) => {
  const now = Date.now();
  const pastOccurrences = occurrences
    .filter((occurrence) => new Date(occurrence.scheduledStartAt).getTime() <= now)
    .sort((left, right) =>
      new Date(right.scheduledStartAt).getTime() - new Date(left.scheduledStartAt).getTime()
    );

  if (pastOccurrences.length) {
    return pastOccurrences[0];
  }

  return [...occurrences].sort(byScheduledAsc)[0];
};

const hasRealTiming = (occurrence: OpsOccurrence) =>
  Boolean(occurrence.actualStartAt || occurrence.actualEndAt);

export const JobLatestOccurrencePanel = ({
  jobId,
  occurrences,
}: {
  jobId: string;
  occurrences: OpsOccurrence[];
}) => {
  const latestOccurrence = getLatestOccurrence(occurrences);

  return (
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Ultima ocurrencia</CardTitle>
          <p className="text-sm text-muted-foreground">
            Resumen rapido de la visita mas reciente del trabajo.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={`/dashboard/jobs/${jobId}/occurrences`}>Ver ocurrencias</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {latestOccurrence ? (
          <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <OccurrenceStatusBadge status={latestOccurrence.status} />
              {latestOccurrence.isDetached ? (
                <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  Separada
                </span>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {formatDate(latestOccurrence.scheduledStartAt)}
              </span>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Equipo
                </p>
                <p className="font-medium">
                  {getOccurrenceEmployeesLabel(latestOccurrence)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Programado
                </p>
                <p className="font-medium">
                  {formatTime(latestOccurrence.scheduledStartAt)} -{" "}
                  {formatTime(latestOccurrence.scheduledEndAt)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Horario real
                </p>
                <p className="font-medium">
                  {hasRealTiming(latestOccurrence)
                    ? `${formatTime(latestOccurrence.actualStartAt)} - ${formatTime(latestOccurrence.actualEndAt)}`
                    : "Sin registrar"}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notas
              </p>
              <p className="text-muted-foreground">
                {latestOccurrence.notes || "Sin notas para esta visita."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavia no hay ocurrencias para este trabajo.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
