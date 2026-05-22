"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployeesAction } from "@/components/ops/actions/employees/get-employees.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { EmployeeFilters } from "@/schemas/ops";

export const useEmployees = (filters?: EmployeeFilters) => {
  const employeesQuery = useQuery({
    queryKey: [...opsQueryKeys.employees, filters ?? {}],
    queryFn: () => getEmployeesAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    employees: employeesQuery.data ?? [],
    isLoading: employeesQuery.isLoading,
    isFetching: employeesQuery.isFetching,
    error: employeesQuery.error,
    refetch: employeesQuery.refetch,
  };
};

