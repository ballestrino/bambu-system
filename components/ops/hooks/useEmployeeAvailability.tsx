"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployeeAvailabilityRulesAction } from "@/components/ops/actions/employees/get-employee-availability-rules.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { EmployeeAvailabilityFilters } from "@/schemas/ops";

export const useEmployeeAvailability = (
  filters?: EmployeeAvailabilityFilters
) => {
  const availabilityQuery = useQuery({
    queryKey: [...opsQueryKeys.employeeAvailability, filters ?? {}],
    queryFn: () => getEmployeeAvailabilityRulesAction(filters),
    staleTime: 1000 * 60 * 5,
  });

  return {
    error: availabilityQuery.error,
    isLoading: availabilityQuery.isLoading,
    refetch: availabilityQuery.refetch,
    rules: availabilityQuery.data ?? [],
  };
};
