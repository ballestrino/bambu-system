"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobScheduleRulesAction } from "@/components/ops/actions/jobs/get-job-schedule-rules.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { JobScheduleRuleFilters } from "@/schemas/ops";

export const useJobScheduleRules = (
  filters?: JobScheduleRuleFilters,
  options?: { enabled?: boolean }
) => {
  const jobId = filters?.jobId;
  const scheduleRulesQuery = useQuery({
    enabled: options?.enabled ?? true,
    queryKey: [...opsQueryKeys.scheduleRules(jobId), filters ?? {}],
    queryFn: () => getJobScheduleRulesAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    scheduleRules: scheduleRulesQuery.data ?? [],
    isLoading: scheduleRulesQuery.isLoading,
    isFetching: scheduleRulesQuery.isFetching,
    error: scheduleRulesQuery.error,
    refetch: scheduleRulesQuery.refetch,
  };
};

