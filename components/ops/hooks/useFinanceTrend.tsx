"use client";

import { useQuery } from "@tanstack/react-query";

import { getFinanceTrendAction } from "@/components/ops/actions/finance/get-finance-trend.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { FinanceTrendQueryInput } from "@/schemas/ops";

export const useFinanceTrend = (
  query: FinanceTrendQueryInput,
  enabled = true
) => {
  const trendQuery = useQuery({
    queryKey: opsQueryKeys.financeTrend(query),
    queryFn: () => getFinanceTrendAction(query),
    enabled,
    staleTime: 60_000,
  });

  return {
    error: trendQuery.error,
    isFetching: trendQuery.isFetching,
    isLoading: trendQuery.isLoading,
    refetch: trendQuery.refetch,
    trend: trendQuery.data ?? [],
  };
};
