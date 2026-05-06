"use client";

import DeleteDialog from "@/components/ui/delete-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import { formatDateTime } from "@/components/ops/utils";
import type { OpsOccurrence, OpsScheduleRule } from "@/components/ops/types";

export const JobOccurrencesPanel = ({
  jobId,
  scheduleRules,
  occurrences,
  onArchive,
  onDetach,
}: {
  jobId: string;
  scheduleRules: OpsScheduleRule[];
  occurrences: OpsOccurrence[];
  onArchive: (occurrenceId: string) => Promise<void>;
  onDetach: (args: { occurrenceId: string }) => Promise<void>;
}) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Ocurrencias</CardTitle>
      <JobOccurrenceDialog jobId={jobId} scheduleRules={scheduleRules} />
    </CardHeader>
    <CardContent className="space-y-3">
      {occurrences.length ? (
        occurrences.map((occurrence) => (
          <div key={occurrence.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <OccurrenceStatusBadge status={occurrence.status} />
                  {occurrence.isDetached ? <span className="text-xs text-muted-foreground">Separada</span> : null}
                </div>
                <p className="font-medium">
                  {occurrence.employee?.name ?? "Sin empleada asignada"}
                </p>
                <p>{formatDateTime(occurrence.scheduledStartAt)} → {formatDateTime(occurrence.scheduledEndAt)}</p>
                {occurrence.actualStartAt || occurrence.actualEndAt ? (
                  <p className="text-muted-foreground">
                    Real {formatDateTime(occurrence.actualStartAt)} → {formatDateTime(occurrence.actualEndAt)}
                  </p>
                ) : null}
                <p className="text-muted-foreground">{occurrence.notes || "Sin notas"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <JobOccurrenceDialog jobId={jobId} scheduleRules={scheduleRules} occurrence={occurrence} />
                {!occurrence.isDetached ? (
                  <DeleteDialog
                    title="Separar ocurrencia"
                    description="La ocurrencia quedará independiente de su regla."
                    deleteButtonText="Separar"
                    deleteButtonVariant="default"
                    onConfirm={async () => {
                      await onDetach({ occurrenceId: occurrence.id });
                    }}
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
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay ocurrencias para este trabajo.</p>
      )}
    </CardContent>
  </Card>
);
