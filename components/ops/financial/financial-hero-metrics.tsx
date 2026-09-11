"use client";

import { CircleDollarSign, TrendingUp, WalletCards } from "lucide-react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import { formatDashboardMoney } from "@/components/ops/dashboard/dashboard-financials";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { OpsMetricsGrid } from "@/components/ops/shared";
import type { getFinancialSummary } from "@/lib/ops/finance";

const loadingValue = "…";

export const FinancialHeroMetrics = ({
  projectedProfit,
  projectedRevenue,
  summary,
  workspace,
}: {
  projectedProfit: number;
  projectedRevenue: number;
  summary: ReturnType<typeof getFinancialSummary>;
  workspace: FinancialWorkspace;
}) => {
  if (workspace.errors.summary) {
    return (
      <DashboardSectionError
        description="Los importes quedan ocultos hasta recuperar las consultas necesarias."
        onRetry={workspace.refresh.all}
        title="No pudimos calcular el resumen financiero"
      />
    );
  }

  const isLoading = workspace.loading.summary;

  return (
    <OpsMetricsGrid
      className="sm:grid-cols-3 xl:grid-cols-3"
      metrics={[
        {
          helper: isLoading
            ? "Calculando proyección"
            : `Proyectado: ${formatDashboardMoney(projectedRevenue)}`,
          icon: CircleDollarSign,
          label: "Cobrado",
          tone: "money",
          value: isLoading ? loadingValue : formatCostMoney(summary.recordedRevenue),
        },
        {
          helper: isLoading
            ? "Calculando egresos"
            : `Costes ${formatCostMoney(summary.manualCostsTotal)} · Empleadas ${formatCostMoney(summary.employeePaymentsTotal)}`,
          icon: WalletCards,
          label: "Egresos",
          tone: "warning",
          value: isLoading ? loadingValue : formatCostMoney(summary.totalCosts),
        },
        {
          helper: isLoading
            ? "Calculando resultado"
            : `Margen ${summary.marginPercent.toFixed(1)}% · proyectado ${formatDashboardMoney(projectedProfit)}`,
          icon: TrendingUp,
          label: "Resultado",
          tone: summary.realProfit >= 0 ? "success" : "danger",
          value: isLoading ? loadingValue : formatCostMoney(summary.realProfit),
        },
      ]}
    />
  );
};
