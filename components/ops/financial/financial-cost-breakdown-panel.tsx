"use client";

import dynamic from "next/dynamic";
import { PieChart } from "lucide-react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import type { CostBreakdownRow } from "@/components/ops/financial/financial-cost-breakdown-data";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { OpsEmptyState, OpsSection } from "@/components/ops/shared";
import { Skeleton } from "@/components/ui/skeleton";

const FinanceCostChart = dynamic(
  () =>
    import("@/components/ops/financial/finance-cost-chart").then(
      (module) => module.FinanceCostChart
    ),
  { loading: () => <Skeleton className="h-56 w-full" />, ssr: false }
);

export const FinancialCostBreakdownPanel = ({
  rows,
  workspace,
}: {
  rows: CostBreakdownRow[];
  workspace: FinancialWorkspace;
}) => (
  <OpsSection
    description="Los pagos a empleadas entran como una fila más, así la suma da el total de egresos."
    title="Egresos por categoría"
  >
    {workspace.errors.costs ? (
      <DashboardSectionError
        description="No mostramos ceros porque faltan datos de costes."
        onRetry={workspace.refresh.costs}
        title="No pudimos cargar los egresos"
      />
    ) : workspace.loading.costs ? (
      <Skeleton className="h-56 w-full" />
    ) : rows.length === 0 ? (
      <OpsEmptyState
        description="Registra BPS, taxi, bus u otros gastos para ver en qué se va la plata del mes."
        icon={PieChart}
        title="Todavía no hay egresos este mes"
      />
    ) : (
      <>
        <FinanceCostChart rows={rows} />
        <dl className="mt-4 grid gap-2">
          {rows.map((row) => (
            <div
              className="flex items-center justify-between gap-3 text-sm"
              key={row.name}
            >
              <dt className="flex min-w-0 items-center gap-2 text-ops-text-muted">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-ops-border"
                  style={row.color ? { backgroundColor: row.color } : undefined}
                />
                <span className="truncate">{row.name}</span>
              </dt>
              <dd className="shrink-0 font-medium tabular-nums text-ops-text">
                {formatCostMoney(row.amount)}
                <span className="ml-2 text-ops-text-muted">
                  {row.share.toFixed(0)}%
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </>
    )}
  </OpsSection>
);
