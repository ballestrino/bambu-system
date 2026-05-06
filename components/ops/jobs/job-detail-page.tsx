"use client";

import { AlertCircle } from "lucide-react";

import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { JobOccurrencesPanel } from "@/components/ops/jobs/job-occurrences-panel";
import { JobScheduleRulesPanel } from "@/components/ops/jobs/job-schedule-rules-panel";
import { JobSummaryCard } from "@/components/ops/jobs/job-summary-card";
import { useJob } from "@/components/ops/hooks/useJob";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobScheduleRuleMutations } from "@/components/ops/hooks/useJobScheduleRuleMutations";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { Card, CardContent } from "@/components/ui/card";

export const JobDetailPage = ({ jobId }: { jobId: string }) => {
  const { job, isLoading, error } = useJob(jobId);
  const { scheduleRules } = useJobScheduleRules({ jobId });
  const { occurrences } = useJobOccurrences({ jobId }, jobId);
  const { archiveScheduleRuleAsync } = useJobScheduleRuleMutations(jobId);
  const { archiveOccurrenceAsync, detachOccurrenceAsync } = useJobOccurrenceMutations(jobId);

  if (isLoading) {
    return <div className="container w-full animate-pulse rounded-lg bg-muted/40 p-20" />;
  }

  if (error || !job) {
    return (
      <Card className="container w-full border-dashed">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No pudimos cargar el trabajo</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{job.name}</h1>
          <p className="text-muted-foreground">Detalle operativo, snapshot y calendario manual.</p>
        </div>
        <JobFormDialog job={job} triggerLabel="Editar trabajo" />
      </div>
      <JobSummaryCard job={job} />
      <div className="grid gap-6 xl:grid-cols-2">
        <JobScheduleRulesPanel
          jobId={jobId}
          rules={scheduleRules}
          onArchive={async (scheduleRuleId) => {
            await archiveScheduleRuleAsync(scheduleRuleId);
          }}
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
      </div>
    </div>
  );
};
