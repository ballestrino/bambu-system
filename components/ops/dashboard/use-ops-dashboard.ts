"use client";

import { useMemo } from "react";
import type { PaymentStatus } from "@prisma/client";

import { getDashboardFinancials } from "@/components/ops/dashboard/dashboard-financials";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useOperationalCosts } from "@/components/ops/hooks/useOperationalCosts";
import { useOpsCostSettings } from "@/components/ops/hooks/useOpsCostSettings";
import {
  getPendingRegistrationVisits,
  getPendingVisitsRange,
} from "@/components/ops/jobs/pending-visits-utils";
import { useOpsSelectedMonth } from "@/components/ops/shared";
import type { JobOccurrenceFilters } from "@/schemas/ops";

export const useOpsDashboard = () => {
  const { month, monthKey, monthRange } = useOpsSelectedMonth();
  const occurrenceFilters = useMemo<JobOccurrenceFilters>(() => {
    const { endDate } = getPendingVisitsRange();
    return { endDate, includeArchived: false, statuses: ["SCHEDULED"] };
  }, []);
  const financialDateFilters = useMemo<{
    endDate: Date;
    startDate: Date;
    statuses: PaymentStatus[];
  }>(
    () => ({
      endDate: monthRange.end,
      startDate: monthRange.start,
      statuses: ["RECORDED"],
    }),
    [monthRange.end, monthRange.start]
  );

  const visits = useJobOccurrences(occurrenceFilters, "dashboard-visits");
  const monthlyVisits = useJobOccurrences(
    {
      endDate: financialDateFilters.endDate,
      includeArchived: false,
      startDate: financialDateFilters.startDate,
    },
    `dashboard-month-visits-${monthKey}`
  );
  const employees = useEmployees({ includeArchived: false, isActive: true });
  const jobs = useJobs({ includeArchived: false });
  const clientPayments = useJobClientPayments(
    financialDateFilters,
    `dashboard-recorded-payments-${monthKey}`
  );
  const employeePayments = useEmployeePayments(
    { assignedMonth: month, statuses: ["RECORDED"] },
    `dashboard-recorded-employee-payments-${monthKey}`
  );
  const costs = useOperationalCosts(
    financialDateFilters,
    `dashboard-recorded-costs-${monthKey}`
  );
  const settings = useOpsCostSettings();
  const scheduleRules = useJobScheduleRules({ isActive: true });
  const profitability = useJobProfitability({ mode: "MONTH", month });

  const pendingVisitCount = useMemo(
    () => getPendingRegistrationVisits(visits.occurrences).length,
    [visits.occurrences]
  );
  const financials = useMemo(
    () =>
      getDashboardFinancials({
        bpsEstimatePercent: Number(settings.settings?.bpsEstimatePercent ?? 0),
        clientPayments: clientPayments.payments,
        employeePayments: employeePayments.payments,
        jobs: jobs.jobs,
        operationalCosts: costs.costs,
      }),
    [clientPayments.payments, costs.costs, employeePayments.payments, jobs.jobs, settings.settings?.bpsEstimatePercent]
  );

  const refreshVisits = () =>
    Promise.all([visits.refetch(), scheduleRules.refetch()]);
  const refreshOperations = () =>
    Promise.all([visits.refetch(), monthlyVisits.refetch(), employees.refetch()]);
  const refreshFinancials = () =>
    Promise.all([
      costs.refetch(),
      employeePayments.refetch(),
      jobs.refetch(),
      clientPayments.refetch(),
      settings.refetch(),
    ]);
  const refreshDashboard = () =>
    Promise.all([
      refreshOperations(),
      refreshFinancials(),
      scheduleRules.refetch(),
      profitability.refetch(),
    ]);

  return {
    employees,
    financialError:
      costs.error ?? employeePayments.error ?? jobs.error ??
      clientPayments.error ?? settings.error,
    financials,
    isFinancialsLoading:
      costs.isLoading || employeePayments.isLoading || jobs.isLoading ||
      clientPayments.isLoading || settings.isLoading,
    isRefreshing:
      costs.isFetching || employeePayments.isFetching || employees.isFetching ||
      jobs.isFetching || monthlyVisits.isFetching || clientPayments.isFetching ||
      scheduleRules.isFetching || settings.isFetching || visits.isFetching ||
      profitability.isFetching,
    monthlyVisits,
    operationsError: visits.error ?? monthlyVisits.error ?? employees.error,
    pendingVisitCount,
    profitability,
    refreshDashboard,
    refreshFinancials,
    refreshOperations,
    refreshVisits,
    scheduleRules,
    visits,
    visitsError: visits.error ?? scheduleRules.error,
  };
};
