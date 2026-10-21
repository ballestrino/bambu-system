"use client";

import { useQuery } from "@tanstack/react-query";

import { getPaidEmployeeIdsAction } from "@/components/ops/actions/employees/get-paid-employee-ids.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { VisitPayrollImpact } from "@/components/ops/visit-payroll-impact";

// Under the employee payments root, so recording or voiding a payment
// refreshes it.
export const useVisitPaidEmployees = (impact: VisitPayrollImpact | null) => {
  const employeeIds = impact?.employees.map((employee) => employee.id) ?? [];
  const paymentMonthKey = impact?.paymentMonthKey ?? "";

  const query = useQuery({
    queryKey: [
      ...opsQueryKeys.employeePaymentScope(`paid-${paymentMonthKey}`),
      employeeIds,
    ],
    queryFn: () => getPaidEmployeeIdsAction({ employeeIds, paymentMonthKey }),
    enabled: employeeIds.length > 0,
    staleTime: 1000 * 60,
  });

  return {
    error: query.error,
    isLoading: query.isLoading,
    paidEmployeeIds: query.data ?? [],
  };
};
