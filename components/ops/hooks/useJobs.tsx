"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobsAction } from "@/components/ops/actions/get-jobs.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { JobFilters } from "@/schemas/ops";

export const useJobs = (filters?: JobFilters) => {
  const jobsQuery = useQuery({
    queryKey: [...opsQueryKeys.jobs, filters ?? {}],
    queryFn: () => getJobsAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    jobs: jobsQuery.data ?? [],
    isLoading: jobsQuery.isLoading,
    isFetching: jobsQuery.isFetching,
    error: jobsQuery.error,
    refetch: jobsQuery.refetch,
  };
};
