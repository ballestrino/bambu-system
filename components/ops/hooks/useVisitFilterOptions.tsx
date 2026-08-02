"use client";

import { useQuery } from "@tanstack/react-query";

import { getVisitFilterOptionsAction } from "@/components/ops/actions/jobs/get-visits.action";
import { opsQueryKeys } from "@/components/ops/query-keys";

export const useVisitFilterOptions = () => {
  const optionsQuery = useQuery({
    queryFn: getVisitFilterOptionsAction,
    queryKey: opsQueryKeys.visitFilterOptions,
    staleTime: 1000 * 60 * 10,
  });

  return {
    employeeOptions: optionsQuery.data?.employees ?? [],
    error: optionsQuery.error,
    jobOptions: optionsQuery.data?.jobs ?? [],
    refetch: optionsQuery.refetch,
  };
};
