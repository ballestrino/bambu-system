"use client";

import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useOperationalCostCategories } from "@/components/ops/hooks/useOperationalCostCategories";
import { useOperationalCosts } from "@/components/ops/hooks/useOperationalCosts";
import { useOpsCostSettings } from "@/components/ops/hooks/useOpsCostSettings";
import { useOpsSelectedMonth } from "@/components/ops/shared";

export const useFinancialWorkspace = () => {
  const { month, monthKey, monthRange } = useOpsSelectedMonth();
  const jobsQuery = useJobs({ includeArchived: false });
  const employeesQuery = useEmployees({ includeArchived: true });
  const categoriesQuery = useOperationalCostCategories({ isActive: true });
  const settingsQuery = useOpsCostSettings();
  const paymentsQuery = useJobClientPayments(
    { assignedMonth: month },
    `financial-payments-${monthKey}`
  );
  const costsQuery = useOperationalCosts(
    { assignedMonth: month },
    `financial-costs-${monthKey}`
  );
  const employeePaymentsQuery = useEmployeePayments(
    { assignedMonth: month },
    `financial-payroll-${monthKey}`
  );
  const occurrencesQuery = useJobOccurrences(
    {
      endDate: monthRange.end,
      includeArchived: false,
      startDate: monthRange.start,
      statuses: ["DONE"],
    },
    `financial-occurrences-${monthKey}`
  );

  const refreshPayments = () =>
    Promise.all([
      jobsQuery.refetch(),
      paymentsQuery.refetch(),
      occurrencesQuery.refetch(),
    ]);
  const refreshCosts = () =>
    Promise.all([
      categoriesQuery.refetch(),
      costsQuery.refetch(),
      employeesQuery.refetch(),
      jobsQuery.refetch(),
      settingsQuery.refetch(),
    ]);
  const refreshPayroll = () =>
    Promise.all([
      employeePaymentsQuery.refetch(),
      employeesQuery.refetch(),
      occurrencesQuery.refetch(),
    ]);
  const refreshAll = () =>
    Promise.all([
      categoriesQuery.refetch(),
      costsQuery.refetch(),
      employeePaymentsQuery.refetch(),
      employeesQuery.refetch(),
      jobsQuery.refetch(),
      occurrencesQuery.refetch(),
      paymentsQuery.refetch(),
      settingsQuery.refetch(),
    ]);

  return {
    categories: categoriesQuery.categories,
    clientPayments: paymentsQuery.payments,
    costs: costsQuery.costs,
    employeePayments: employeePaymentsQuery.payments,
    employees: employeesQuery.employees,
    errors: {
      costs: categoriesQuery.error || costsQuery.error || settingsQuery.error,
      payments: jobsQuery.error || paymentsQuery.error || occurrencesQuery.error,
      payroll:
        employeePaymentsQuery.error || employeesQuery.error || occurrencesQuery.error,
      summary:
        costsQuery.error ||
        employeePaymentsQuery.error ||
        paymentsQuery.error ||
        settingsQuery.error,
    },
    isFetching:
      categoriesQuery.isFetching ||
      costsQuery.isFetching ||
      employeePaymentsQuery.isFetching ||
      employeesQuery.isFetching ||
      jobsQuery.isFetching ||
      occurrencesQuery.isFetching ||
      paymentsQuery.isFetching ||
      settingsQuery.isFetching,
    loading: {
      costs: categoriesQuery.isLoading || costsQuery.isLoading,
      payments: jobsQuery.isLoading || paymentsQuery.isLoading,
      payroll: employeePaymentsQuery.isLoading || employeesQuery.isLoading,
      summary:
        costsQuery.isLoading ||
        employeePaymentsQuery.isLoading ||
        paymentsQuery.isLoading ||
        settingsQuery.isLoading,
    },
    month,
    monthKey,
    monthRange,
    occurrences: occurrencesQuery.occurrences,
    refresh: {
      all: refreshAll,
      costs: refreshCosts,
      payments: refreshPayments,
      payroll: refreshPayroll,
    },
    settings: settingsQuery.settings,
    jobs: jobsQuery.jobs,
  };
};

export type FinancialWorkspace = ReturnType<typeof useFinancialWorkspace>;
