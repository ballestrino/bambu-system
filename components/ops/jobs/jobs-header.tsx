"use client";

import { ExportJobsButton } from "@/components/ops/jobs/export-jobs-button";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import type { JobFilters } from "@/schemas/ops";

export const JobsHeader = ({
  count,
  filters,
  jobIds,
}: {
  count: number;
  filters: JobFilters;
  jobIds?: string[];
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">Trabajos</h1>
      <p className="text-muted-foreground">
        Operaciones activas, borradores y archivo histórico en un solo lugar.
      </p>
      <p className="text-sm text-muted-foreground">{count} trabajo(s) en pantalla</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <ExportJobsButton filters={filters} jobIds={jobIds} />
      <JobFormDialog />
    </div>
  </div>
);
