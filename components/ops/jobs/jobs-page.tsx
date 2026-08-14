"use client";

import { BriefcaseBusiness } from "lucide-react";

import { JobCard } from "@/components/ops/jobs/job-card";
import { JobFilters } from "@/components/ops/jobs/job-filters";
import { JobsHeader } from "@/components/ops/jobs/jobs-header";
import { useJobMutations } from "@/components/ops/hooks/useJobMutations";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { profitabilityNeedsAttention } from "@/components/ops/profitability/profitability-status";
import {
  OpsEmptyState,
  OpsPageShell,
  OpsRecordList,
  OpsRecordSkeleton,
  useOpsDebouncedValue,
  useOpsPersistedState,
  useOpsSelectedMonth,
} from "@/components/ops/shared";
import { jobStatusValues, type JobFilters as JobFiltersInput } from "@/schemas/ops";

type JobStatusFilter = (typeof jobStatusValues)[number] | "all";
type JobVisibilityFilter = "DEFAULT" | "PUNCTUAL" | "ALL";

type JobFilterState = {
  query: string;
  status: JobStatusFilter;
  visibility: JobVisibilityFilter;
  includeArchived: boolean;
  profitability: "all" | "attention";
};

const defaultJobFilters: JobFilterState = {
  query: "",
  status: "all",
  visibility: "DEFAULT",
  includeArchived: false,
  profitability: "all",
};

export const JobsPage = () => {
  const { month } = useOpsSelectedMonth();
  const [filterState, setFilterState] = useOpsPersistedState(
    "bambu:ops:jobs:filters",
    defaultJobFilters
  );
  const debouncedQuery = useOpsDebouncedValue(filterState.query, 1500);

  const filters: JobFiltersInput = {
    query: debouncedQuery || undefined,
    statuses:
      filterState.status !== "all" ? [filterState.status] : undefined,
    visibility: filterState.visibility,
    includeArchived: filterState.includeArchived,
  };
  const exportFilters: JobFiltersInput = {
    ...filters,
    query: filterState.query.trim() || undefined,
  };

  const { jobs, isFetching, isLoading, refetch } = useJobs(filters);
  const profitabilityQuery = useJobProfitability({ mode: "MONTH", month });
  const profitabilityByJob = new Map(
    profitabilityQuery.profitability.map((result) => [result.jobId, result])
  );
  const visibleJobs = filterState.profitability === "attention"
    ? jobs.filter((job) => {
        const result = profitabilityByJob.get(job.id);
        return result ? profitabilityNeedsAttention(result.severity) : false;
      })
    : jobs;
  const { archiveJobAsync } = useJobMutations();
  const updateFilters = (values: Partial<JobFilterState>) => {
    setFilterState((current) => ({ ...current, ...values }));
  };

  return (
    <OpsPageShell>
      <JobsHeader
        count={visibleJobs.length}
        filters={exportFilters}
        jobIds={filterState.profitability === "attention" ? visibleJobs.map(({ id }) => id) : undefined}
      />
      <JobFilters
        query={filterState.query}
        status={filterState.status}
        profitability={filterState.profitability}
        visibility={filterState.visibility}
        includeArchived={filterState.includeArchived}
        isRefreshing={isFetching || profitabilityQuery.isFetching}
        onQueryChange={(query) => updateFilters({ query })}
        onRefresh={async () => { await Promise.all([refetch(), profitabilityQuery.refetch()]); }}
        onProfitabilityChange={(profitability) =>
          updateFilters({ profitability: profitability as JobFilterState["profitability"] })
        }
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
      {isLoading || profitabilityQuery.isLoading ? (
        <OpsRecordSkeleton count={6} />
      ) : visibleJobs.length ? (
        <OpsRecordList>
          {visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              profitability={profitabilityByJob.get(job.id)}
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
