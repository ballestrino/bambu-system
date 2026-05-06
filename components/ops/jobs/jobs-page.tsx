"use client";

import { useDeferredValue, useState } from "react";

import { JobCard } from "@/components/ops/jobs/job-card";
import { JobFilters } from "@/components/ops/jobs/job-filters";
import { JobsHeader } from "@/components/ops/jobs/jobs-header";
import { useJobMutations } from "@/components/ops/hooks/useJobMutations";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { Card, CardContent } from "@/components/ui/card";
import { jobStatusValues } from "@/schemas/ops";

type JobStatusFilter = (typeof jobStatusValues)[number] | "all";

export const JobsPage = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatusFilter>("all");
  const [includeArchived, setIncludeArchived] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filters = {
    query: deferredQuery || undefined,
    statuses: status !== "all" ? [status] : undefined,
    includeArchived,
  };

  const { jobs, isLoading } = useJobs(filters);
  const { archiveJobAsync } = useJobMutations();

  return (
    <div className="container flex w-full flex-col gap-6">
      <JobsHeader count={jobs.length} />
      <JobFilters
        query={query}
        status={status}
        includeArchived={includeArchived}
        onQueryChange={setQuery}
        onStatusChange={(value) => setStatus(value as JobStatusFilter)}
        onIncludeArchivedChange={setIncludeArchived}
      />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-52 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : jobs.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onArchive={async (nextJobId) => {
                await archiveJobAsync(nextJobId);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
            <h2 className="text-lg font-semibold">Todavía no hay trabajos en este filtro</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Probá crear un trabajo nuevo o afinar la búsqueda por nombre, estado o archivo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
