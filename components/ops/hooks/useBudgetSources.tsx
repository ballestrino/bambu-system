"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getBudgetSourcesAction } from "@/components/ops/actions/budgets/get-budget-sources.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OpsBudgetSource } from "@/components/ops/types";

const PAGE_SIZE = 5;

type UseBudgetSourcesParams = {
  query?: string;
  selectedBudgetId?: string;
};

export const useBudgetSources = ({
  query,
  selectedBudgetId,
}: UseBudgetSourcesParams = {}) => {
  const budgetSourcesQuery = useInfiniteQuery({
    queryKey: opsQueryKeys.budgetSources({ query, selectedBudgetId }),
    queryFn: ({ pageParam }) =>
      getBudgetSourcesAction({
        limit: PAGE_SIZE,
        page: pageParam,
        query,
        selectedBudgetId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
  const budgetSourceMap = new Map<string, OpsBudgetSource>();
  budgetSourcesQuery.data?.pages.forEach((page) => {
    page.budgets?.forEach((budget) => {
      if (!budgetSourceMap.has(budget.id)) {
        budgetSourceMap.set(budget.id, budget);
      }
    });
  });
  const budgetSources = Array.from(budgetSourceMap.values());

  return {
    budgetSources,
    fetchNextPage: budgetSourcesQuery.fetchNextPage,
    hasNextPage: budgetSourcesQuery.hasNextPage,
    isFetchingNextPage: budgetSourcesQuery.isFetchingNextPage,
    isLoading: budgetSourcesQuery.isLoading,
    isFetching: budgetSourcesQuery.isFetching,
    error: budgetSourcesQuery.error,
  };
};

