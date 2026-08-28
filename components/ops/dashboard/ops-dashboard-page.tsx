"use client";

import { DashboardMetricGrid } from "@/components/ops/dashboard/dashboard-metric-grid";
import { DashboardProfitabilityAlerts } from "@/components/ops/dashboard/dashboard-profitability-alerts";
import { DashboardQuickActions } from "@/components/ops/dashboard/dashboard-quick-actions";
import { DashboardVisitsPanel } from "@/components/ops/dashboard/dashboard-visits-panel";
import { useOpsDashboard } from "@/components/ops/dashboard/use-ops-dashboard";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";

export const OpsDashboardPage = () => {
  const dashboard = useOpsDashboard();

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={
          <DashboardQuickActions
            isRefreshing={dashboard.isRefreshing}
            onRefresh={dashboard.refreshDashboard}
          />
        }
        description="Organizá las visitas que requieren atención y revisá el estado del mes."
        eyebrow="Operaciones"
        title="Hoy en Bambú"
      />

      <DashboardVisitsPanel
        error={dashboard.visitsError}
        isLoading={dashboard.visits.isLoading || dashboard.scheduleRules.isLoading}
        occurrences={dashboard.visits.occurrences}
        onRetry={dashboard.refreshVisits}
        scheduleRules={dashboard.scheduleRules.scheduleRules}
      />

      <DashboardMetricGrid
        activeEmployeeCount={dashboard.employees.employees.length}
        areFinancialsLoading={dashboard.isFinancialsLoading}
        areOperationsLoading={
          dashboard.visits.isLoading ||
          dashboard.monthlyVisits.isLoading ||
          dashboard.employees.isLoading
        }
        financialError={dashboard.financialError}
        financials={dashboard.financials}
        monthlyVisitCount={dashboard.monthlyVisits.occurrences.length}
        onRetryFinancials={dashboard.refreshFinancials}
        onRetryOperations={dashboard.refreshOperations}
        operationsError={dashboard.operationsError}
        pendingVisitCount={dashboard.pendingVisitCount}
      />

      <DashboardProfitabilityAlerts
        error={dashboard.profitability.error}
        isLoading={dashboard.profitability.isLoading}
        onRetry={dashboard.profitability.refetch}
        results={dashboard.profitability.profitability}
      />
    </OpsPageShell>
  );
};
