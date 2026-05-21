"use client";

import { useMemo } from "react";

import { getDashboardFinancials } from "@/components/ops/dashboard/dashboard-financials";
import { DashboardMetricGrid } from "@/components/ops/dashboard/dashboard-metric-grid";
import { DashboardQuickActions } from "@/components/ops/dashboard/dashboard-quick-actions";
import { DashboardVisitsPanel } from "@/components/ops/dashboard/dashboard-visits-panel";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { useJobs } from "@/components/ops/hooks/useJobs";
import {
  getPendingRegistrationVisits,
  getPendingVisitsRange,
} from "@/components/ops/jobs/pending-visits-utils";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";
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

  const {
    occurrences,
    isFetching: areVisitsFetching,
    isLoading: areVisitsLoading,
    refetch: refetchVisits,
  } = useJobOccurrences(occurrenceFilters, "dashboard-visits");
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
  } = useJobClientPayments({ statuses: ["RECORDED"] }, "dashboard-recorded-payments");
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
    () => getDashboardFinancials(jobs, payments),
    [jobs, payments]
  );
  const isRefreshing =
    areEmployeesFetching ||
    areJobsFetching ||
    arePaymentsFetching ||
    areRulesFetching ||
    areVisitsFetching;
  const refreshDashboard = async () => {
    await Promise.all([
      refetchEmployees(),
      refetchJobs(),
      refetchPayments(),
      refetchScheduleRules(),
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
        areFinancialsLoading={areJobsLoading || arePaymentsLoading}
        areVisitsLoading={areVisitsLoading}
        financials={financials}
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
