"use client";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const byScheduledAt = (left: OpsOccurrence, right: OpsOccurrence) => {
  const leftTime = new Date(left.scheduledStartAt).getTime();
  const rightTime = new Date(right.scheduledStartAt).getTime();
  const leftPending = left.status === "SCHEDULED";
  const rightPending = right.status === "SCHEDULED";

  if (leftPending !== rightPending) {
    return leftPending ? -1 : 1;
  }

  return leftPending ? leftTime - rightTime : rightTime - leftTime;
};

const hasRealTiming = (occurrence: OpsOccurrence) =>
  Boolean(occurrence.actualStartAt || occurrence.actualEndAt);

export const JobOccurrencesPanel = ({
  emptyMessage = "Todavía no hay ocurrencias para este trabajo.",
  isLoading = false,
  jobId,
  scheduleRules,
  occurrences,
  onArchive,
  onDetach,
}: {
  emptyMessage?: string;
  isLoading?: boolean;
  jobId: string;
  scheduleRules: OpsScheduleRule[];
  occurrences: OpsOccurrence[];
  onArchive: (occurrenceId: string) => Promise<void>;
  onDetach: (args: { occurrenceId: string }) => Promise<void>;
}) => {
  const sortedOccurrences = [...occurrences].sort(byScheduledAt);

  return (
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ocurrencias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="min-h-40 animate-pulse rounded-2xl bg-muted/40" />
        ) : sortedOccurrences.length ? (
          sortedOccurrences.map((occurrence) => (
            <div key={occurrence.id} className="space-y-4 rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <OccurrenceStatusBadge status={occurrence.status} />
                    {occurrence.isDetached ? (
                      <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                        Separada
                      </span>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(occurrence.scheduledStartAt)}
                    </span>
                  </div>

                  <div className="grid gap-4 text-sm md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Responsable
                      </p>
                      <p className="font-medium">
                        {occurrence.employee?.name ?? "Sin empleada asignada"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Programado
                      </p>
                      <p className="font-medium">
                        {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Horario real
                      </p>
                      <p className="font-medium">
                        {hasRealTiming(occurrence)
                          ? `${formatTime(occurrence.actualStartAt)} - ${formatTime(occurrence.actualEndAt)}`
                          : "Sin registrar"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notas
                    </p>
                    <p className="text-muted-foreground">
                      {occurrence.notes || "Sin notas para esta visita."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <JobOccurrenceDialog
                    jobId={jobId}
                    scheduleRules={scheduleRules}
                    occurrence={occurrence}
                    triggerLabel={occurrence.status === "SCHEDULED" ? "Completar" : "Editar"}
                    triggerVariant={occurrence.status === "SCHEDULED" ? "default" : "outline"}
                  />
                  {!occurrence.isDetached ? (
                    <DeleteDialog
                      title="Separar ocurrencia"
                      description="La ocurrencia quedará independiente de su regla."
                      deleteButtonText="Separar"
                      deleteButtonVariant="default"
                      onConfirm={async () => {
                        await onDetach({ occurrenceId: occurrence.id });
                      }}
                      trigger={
                        <Button size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                          Separar
                        </Button>
                      }
                    />
                  ) : null}
                  <DeleteDialog
                    title="Archivar ocurrencia"
                    description="La ocurrencia dejará de verse en el calendario principal."
                    deleteButtonText="Archivar"
                    deleteButtonVariant="default"
                    onConfirm={async () => {
                      await onArchive(occurrence.id);
                    }}
                    trigger={
                      <Button size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                        Archivar
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
