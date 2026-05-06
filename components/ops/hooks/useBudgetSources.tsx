"use client";

import { useQuery } from "@tanstack/react-query";

import { getBudgetSourcesAction } from "@/components/ops/actions/get-budget-sources.action";
import { opsQueryKeys } from "@/components/ops/query-keys";

export const useBudgetSources = () => {
  const budgetSourcesQuery = useQuery({
    queryKey: opsQueryKeys.budgetSources,
    queryFn: () => getBudgetSourcesAction(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    budgetSources: budgetSourcesQuery.data ?? [],
    isLoading: budgetSourcesQuery.isLoading,
    isFetching: budgetSourcesQuery.isFetching,
    error: budgetSourcesQuery.error,
  };
};
