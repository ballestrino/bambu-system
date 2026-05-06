"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobOccurrencesAction } from "@/components/ops/actions/get-job-occurrences.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { JobOccurrenceFilters } from "@/schemas/ops";

export const useJobOccurrences = (
  filters?: JobOccurrenceFilters,
  queryKeyScope?: string
) => {
  const occurrencesQuery = useQuery({
    queryKey: [
      ...opsQueryKeys.occurrences(queryKeyScope ?? filters?.jobId),
      filters ?? {},
    ],
    queryFn: () => getJobOccurrencesAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    occurrences: occurrencesQuery.data ?? [],
    isLoading: occurrencesQuery.isLoading,
    isFetching: occurrencesQuery.isFetching,
    error: occurrencesQuery.error,
    refetch: occurrencesQuery.refetch,
  };
};
