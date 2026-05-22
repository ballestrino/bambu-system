"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployeeAction } from "@/components/ops/actions/employees/get-employee.action";
import { opsQueryKeys } from "@/components/ops/query-keys";

export const useEmployee = (employeeId: string) => {
  const employeeQuery = useQuery({
    queryKey: opsQueryKeys.employee(employeeId),
    queryFn: () => getEmployeeAction(employeeId),
    staleTime: 1000 * 60,
  });

  return {
    employee: employeeQuery.data ?? null,
    isLoading: employeeQuery.isLoading,
    error: employeeQuery.error,
    refetch: employeeQuery.refetch,
  };
};

