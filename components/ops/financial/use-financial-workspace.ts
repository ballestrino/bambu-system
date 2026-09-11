"use client";

import {
  financeSectionQueries,
  type FinanceSection,
} from "@/components/ops/financial/financial-sections";
import { buildFinancialRefresh } from "@/components/ops/financial/financial-workspace-refresh";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useFinanceTrend } from "@/components/ops/hooks/useFinanceTrend";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useOperationalCostCategories } from "@/components/ops/hooks/useOperationalCostCategories";
import { useOperationalCosts } from "@/components/ops/hooks/useOperationalCosts";
import { useOpsCostSettings } from "@/components/ops/hooks/useOpsCostSettings";
import { useOpsSelectedMonth } from "@/components/ops/shared";

export const useFinancialWorkspace = ({
  section,
}: {
  section: FinanceSection;
}) => {
  const { month, monthKey, monthRange } = useOpsSelectedMonth();
  const needs = financeSectionQueries[section];

  const jobsQuery = useJobs({ includeArchived: false }, needs.jobs);
  const employeesQuery = useEmployees({ includeArchived: true }, needs.employees);
  const categoriesQuery = useOperationalCostCategories(
    { isActive: true },
    needs.categories
  );
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
    `financial-occurrences-${monthKey}`,
    needs.occurrences
  );
  // Resumen and Rentabilidad share this query key, so switching between them
  // reuses one fetch instead of paying for it twice.
  const profitabilityQuery = useJobProfitability(
    { mode: "MONTH", month },
    needs.profitability
  );

  const trendQuery = useFinanceTrend({ month, months: 3 }, needs.trend);

  const refresh = buildFinancialRefresh({
    categories: categoriesQuery,
    costs: costsQuery,
    employeePayments: employeePaymentsQuery,
    employees: employeesQuery,
    jobs: jobsQuery,
    occurrences: occurrencesQuery,
    payments: paymentsQuery,
    profitability: profitabilityQuery,
    settings: settingsQuery,
    trend: trendQuery,
  });

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
      profitabilityQuery.isFetching ||
      settingsQuery.isFetching ||
      trendQuery.isFetching,
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
    profitability: {
      error: profitabilityQuery.error,
      isLoading: profitabilityQuery.isLoading,
      refetch: profitabilityQuery.refetch,
      results: profitabilityQuery.profitability,
    },
    refresh,
    settings: settingsQuery.settings,
    trend: {
      error: trendQuery.error,
      isLoading: trendQuery.isLoading,
      points: trendQuery.trend,
      refetch: trendQuery.refetch,
    },
    jobs: jobsQuery.jobs,
  };
};

export type FinancialWorkspace = ReturnType<typeof useFinancialWorkspace>;
