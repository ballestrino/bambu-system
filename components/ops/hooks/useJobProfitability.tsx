"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobProfitabilityAction } from "@/components/ops/actions/profitability/get-job-profitability.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { ProfitabilityQueryInput } from "@/schemas/ops";

export const useJobProfitability = (
  query: ProfitabilityQueryInput,
  enabled = true
) => {
  const profitabilityQuery = useQuery({
    queryKey: opsQueryKeys.profitability(query),
    queryFn: () => getJobProfitabilityAction(query),
    enabled,
    staleTime: 60_000,
  });

  return {
    error: profitabilityQuery.error,
    isFetching: profitabilityQuery.isFetching,
    isLoading: profitabilityQuery.isLoading,
    profitability: profitabilityQuery.data ?? [],
    refetch: profitabilityQuery.refetch,
  };
};
