"use client";

import { useMemo } from "react";
import type { PaymentStatus } from "@prisma/client";

import { getDashboardFinancials } from "@/components/ops/dashboard/dashboard-financials";
import { DashboardMetricGrid } from "@/components/ops/dashboard/dashboard-metric-grid";
import { DashboardQuickActions } from "@/components/ops/dashboard/dashboard-quick-actions";
import { DashboardVisitsPanel } from "@/components/ops/dashboard/dashboard-visits-panel";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { useOperationalCosts } from "@/components/ops/hooks/useOperationalCosts";
import { useOpsCostSettings } from "@/components/ops/hooks/useOpsCostSettings";
import {
  getPendingRegistrationVisits,
  getPendingVisitsRange,
} from "@/components/ops/jobs/pending-visits-utils";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";
import { getMonthRange } from "@/components/ops/utils";
import type { JobOccurrenceFilters } from "@/schemas/ops";

export const OpsDashboardPage = () => {
  const occurrenceFilters = useMemo<JobOccurrenceFilters>(() => {
    const { endDate } = getPendingVisitsRange();

    return {
      endDate,
      includeArchived: false,
      statuses: ["SCHEDULED"],
    };
  }, []);
  const financialDateFilters = useMemo<{
    endDate: Date;
    startDate: Date;
    statuses: PaymentStatus[];
  }>(() => {
    const { end, start } = getMonthRange(new Date());

    return {
      endDate: end,
      startDate: start,
      statuses: ["RECORDED"],
    };
  }, []);

  const {
    occurrences,
    isFetching: areVisitsFetching,
    isLoading: areVisitsLoading,
    refetch: refetchVisits,
  } = useJobOccurrences(occurrenceFilters, "dashboard-visits");
  const {
    occurrences: monthlyOccurrences,
    isFetching: areMonthlyVisitsFetching,
    isLoading: areMonthlyVisitsLoading,
    refetch: refetchMonthlyVisits,
  } = useJobOccurrences(
    {
      endDate: financialDateFilters.endDate,
      includeArchived: false,
      startDate: financialDateFilters.startDate,
    },
    "dashboard-month-visits"
  );
  const {
    employees,
    isFetching: areEmployeesFetching,
    isLoading: areEmployeesLoading,
    refetch: refetchEmployees,
  } = useEmployees({
    includeArchived: false,
    isActive: true,
  });
  const {
    jobs,
    isFetching: areJobsFetching,
    isLoading: areJobsLoading,
    refetch: refetchJobs,
  } = useJobs({
    includeArchived: false,
  });
  const {
    payments,
    isFetching: arePaymentsFetching,
    isLoading: arePaymentsLoading,
    refetch: refetchPayments,
  } = useJobClientPayments(financialDateFilters, "dashboard-recorded-payments");
  const {
    payments: employeePayments,
    isFetching: areEmployeePaymentsFetching,
    isLoading: areEmployeePaymentsLoading,
    refetch: refetchEmployeePayments,
  } = useEmployeePayments(
    { ...financialDateFilters, basis: "PAYMENT_DATE" },
    "dashboard-recorded-employee-payments"
  );
  const {
    costs,
    isFetching: areCostsFetching,
    isLoading: areCostsLoading,
    refetch: refetchCosts,
  } = useOperationalCosts(financialDateFilters, "dashboard-recorded-costs");
  const {
    settings,
    isFetching: areSettingsFetching,
    isLoading: areSettingsLoading,
    refetch: refetchSettings,
  } = useOpsCostSettings();
  const {
    scheduleRules,
    isFetching: areRulesFetching,
    refetch: refetchScheduleRules,
  } = useJobScheduleRules({ isActive: true });

  const pendingVisitCount = useMemo(
    () => getPendingRegistrationVisits(occurrences).length,
    [occurrences]
  );
  const financials = useMemo(
    () =>
      getDashboardFinancials({
        bpsEstimatePercent: Number(settings?.bpsEstimatePercent ?? 0),
        clientPayments: payments,
        employeePayments,
        jobs,
        operationalCosts: costs,
      }),
    [costs, employeePayments, jobs, payments, settings?.bpsEstimatePercent]
  );
  const isRefreshing =
    areCostsFetching ||
    areEmployeePaymentsFetching ||
    areEmployeesFetching ||
    areJobsFetching ||
    areMonthlyVisitsFetching ||
    arePaymentsFetching ||
    areRulesFetching ||
    areSettingsFetching ||
    areVisitsFetching;
  const refreshDashboard = async () => {
    await Promise.all([
      refetchCosts(),
      refetchEmployeePayments(),
      refetchEmployees(),
      refetchJobs(),
      refetchMonthlyVisits(),
      refetchPayments(),
      refetchScheduleRules(),
      refetchSettings(),
      refetchVisits(),
    ]);
  };

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={
          <DashboardQuickActions
            isRefreshing={isRefreshing}
            onRefresh={refreshDashboard}
          />
        }
        description="Accesos rápidos y visitas que necesitan atención para cerrar la operación diaria."
        eyebrow="Operaciones"
        title="Dashboard operativo"
      />

      <DashboardMetricGrid
        activeEmployeeCount={employees.length}
        areEmployeesLoading={areEmployeesLoading}
        areFinancialsLoading={
          areCostsLoading ||
          areEmployeePaymentsLoading ||
          areJobsLoading ||
          arePaymentsLoading ||
          areSettingsLoading
        }
        areMonthlyVisitsLoading={areMonthlyVisitsLoading}
        areVisitsLoading={areVisitsLoading}
        financials={financials}
        monthlyVisitCount={monthlyOccurrences.length}
        pendingVisitCount={pendingVisitCount}
      />

      <DashboardVisitsPanel
        isLoading={areVisitsLoading}
        occurrences={occurrences}
        scheduleRules={scheduleRules}
      />
    </OpsPageShell>
  );
};
