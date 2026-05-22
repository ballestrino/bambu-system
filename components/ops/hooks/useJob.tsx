"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobAction } from "@/components/ops/actions/jobs/get-job.action";
import { opsQueryKeys } from "@/components/ops/query-keys";

export const useJob = (jobId: string) => {
  const jobQuery = useQuery({
    queryKey: opsQueryKeys.job(jobId),
    queryFn: () => getJobAction(jobId),
    enabled: !!jobId,
    staleTime: 1000 * 60,
  });

  return {
    job: jobQuery.data,
    isLoading: jobQuery.isLoading,
    isFetching: jobQuery.isFetching,
    error: jobQuery.error,
    refetch: jobQuery.refetch,
  };
};

