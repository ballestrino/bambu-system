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

  const { occurrences, isLoading: areVisitsLoading } = useJobOccurrences(
    occurrenceFilters,
    "dashboard-visits"
  );
  const { employees, isLoading: areEmployeesLoading } = useEmployees({
    includeArchived: false,
    isActive: true,
  });
  const { jobs, isLoading: areJobsLoading } = useJobs({
    includeArchived: false,
  });
  const { payments, isLoading: arePaymentsLoading } = useJobClientPayments(
    { statuses: ["RECORDED"] },
    "dashboard-recorded-payments"
  );
  const { scheduleRules } = useJobScheduleRules({ isActive: true });

  const pendingVisitCount = useMemo(
    () => getPendingRegistrationVisits(occurrences).length,
    [occurrences]
  );
  const financials = useMemo(
    () => getDashboardFinancials(jobs, payments),
    [jobs, payments]
  );

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={<DashboardQuickActions />}
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
