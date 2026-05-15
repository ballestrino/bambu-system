"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { JobOccurrencesPanel } from "@/components/ops/jobs/job-occurrences-panel";
import { useJob } from "@/components/ops/hooks/useJob";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const JobOccurrencesPage = ({ jobId }: { jobId: string }) => {
  const { job, isLoading, error } = useJob(jobId);
  const { occurrences } = useJobOccurrences({ jobId }, `job-occurrences-${jobId}`);
  const { scheduleRules } = useJobScheduleRules({ jobId });
  const { archiveOccurrenceAsync, detachOccurrenceAsync } = useJobOccurrenceMutations(jobId);

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

      <JobOccurrencesPanel
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
