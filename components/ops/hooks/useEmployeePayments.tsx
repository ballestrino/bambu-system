"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployeePaymentsAction } from "@/components/ops/actions/employees/get-employee-payments.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { EmployeePaymentFilters } from "@/schemas/ops";

export const useEmployeePayments = (
  filters?: EmployeePaymentFilters,
  queryKeyScope?: string
) => {
  const paymentsQuery = useQuery({
    queryKey: [
      ...opsQueryKeys.employeePaymentScope(queryKeyScope ?? filters?.employeeId),
      filters ?? {},
    ],
    queryFn: () => getEmployeePaymentsAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    isFetching: paymentsQuery.isFetching,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
  };
};

