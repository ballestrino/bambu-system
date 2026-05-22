"use client";

import { BriefcaseBusiness } from "lucide-react";

import { JobCard } from "@/components/ops/jobs/job-card";
import { JobFilters } from "@/components/ops/jobs/job-filters";
import { JobsHeader } from "@/components/ops/jobs/jobs-header";
import { useJobMutations } from "@/components/ops/hooks/useJobMutations";
import { useJobs } from "@/components/ops/hooks/useJobs";
import {
  OpsEmptyState,
  OpsPageShell,
  OpsRecordList,
  OpsRecordSkeleton,
  useOpsDebouncedValue,
  useOpsPersistedState,
} from "@/components/ops/shared";
import { jobStatusValues } from "@/schemas/ops";

type JobStatusFilter = (typeof jobStatusValues)[number] | "all";
type JobVisibilityFilter = "DEFAULT" | "PUNCTUAL" | "ALL";

type JobFilterState = {
  query: string;
  status: JobStatusFilter;
  visibility: JobVisibilityFilter;
  includeArchived: boolean;
};

const defaultJobFilters: JobFilterState = {
  query: "",
  status: "all",
  visibility: "DEFAULT",
  includeArchived: false,
};

export const JobsPage = () => {
  const [filterState, setFilterState] = useOpsPersistedState(
    "bambu:ops:jobs:filters",
    defaultJobFilters
  );
  const debouncedQuery = useOpsDebouncedValue(filterState.query, 1500);

  const filters = {
    query: debouncedQuery || undefined,
    statuses:
      filterState.status !== "all" ? [filterState.status] : undefined,
    visibility: filterState.visibility,
    includeArchived: filterState.includeArchived,
  };

  const { jobs, isFetching, isLoading, refetch } = useJobs(filters);
  const { archiveJobAsync } = useJobMutations();
  const updateFilters = (values: Partial<JobFilterState>) => {
    setFilterState((current) => ({ ...current, ...values }));
  };

  return (
    <OpsPageShell>
      <JobsHeader count={jobs.length} />
      <JobFilters
        query={filterState.query}
        status={filterState.status}
        visibility={filterState.visibility}
        includeArchived={filterState.includeArchived}
        isRefreshing={isFetching}
        onQueryChange={(query) => updateFilters({ query })}
        onRefresh={refetch}
        onStatusChange={(status) =>
          updateFilters({ status: status as JobStatusFilter })
        }
        onVisibilityChange={(visibility) =>
          updateFilters({ visibility: visibility as JobVisibilityFilter })
        }
        onIncludeArchivedChange={(includeArchived) =>
          updateFilters({ includeArchived })
        }
        onClear={() => setFilterState(defaultJobFilters)}
      />
      {isLoading ? (
        <OpsRecordSkeleton count={6} />
      ) : jobs.length ? (
        <OpsRecordList>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onArchive={async (nextJobId) => {
                await archiveJobAsync(nextJobId);
              }}
            />
          ))}
        </OpsRecordList>
      ) : (
        <OpsEmptyState
          icon={BriefcaseBusiness}
          title="Todavía no hay trabajos en este filtro"
          description="Crea un trabajo nuevo o limpia los filtros para volver a ver la operación completa."
        />
      )}
    </OpsPageShell>
  );
};
