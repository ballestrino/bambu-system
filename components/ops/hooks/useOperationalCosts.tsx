"use client";

import { useQuery } from "@tanstack/react-query";

import { getOperationalCostsAction } from "@/components/ops/actions/get-operational-costs.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OperationalCostFilters } from "@/schemas/ops";

export const useOperationalCosts = (
  filters?: OperationalCostFilters,
  queryKeyScope?: string
) => {
  const costsQuery = useQuery({
    queryKey: [...opsQueryKeys.costScope(queryKeyScope), filters ?? {}],
    queryFn: () => getOperationalCostsAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    costs: costsQuery.data ?? [],
    isLoading: costsQuery.isLoading,
    isFetching: costsQuery.isFetching,
    error: costsQuery.error,
    refetch: costsQuery.refetch,
  };
};
