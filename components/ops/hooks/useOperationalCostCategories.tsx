"use client";

import { useQuery } from "@tanstack/react-query";

import { getOperationalCostCategoriesAction } from "@/components/ops/actions/costs/get-operational-cost-categories.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OperationalCostCategoryFilters } from "@/schemas/ops";

export const useOperationalCostCategories = (
  filters?: OperationalCostCategoryFilters
) => {
  const categoriesQuery = useQuery({
    queryKey: [...opsQueryKeys.costCategories, filters ?? {}],
    queryFn: () => getOperationalCostCategoriesAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    isFetching: categoriesQuery.isFetching,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,
  };
};

