"use client";

import dynamic from "next/dynamic";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { OpsEmptyState, OpsMetricCard, OpsSection } from "@/components/ops/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSpline } from "lucide-react";

// recharts is ~100 kB gz and ResponsiveContainer renders nothing until it has
// measured, so keep it out of the SSR pass and the initial bundle.
const FinanceTrendChart = dynamic(
  () =>
    import("@/components/ops/financial/finance-trend-chart").then(
      (module) => module.FinanceTrendChart
    ),
  { loading: () => <Skeleton className="h-56 w-full md:h-64" />, ssr: false }
);

const formatDelta = (current: number, previous: number) => {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatCostMoney(delta)}`;
};

export const FinancialTrendPanel = ({
  trend,
}: {
  trend: FinancialWorkspace["trend"];
}) => {
  const points = trend.points;
  const current = points[points.length - 1];
  const previous = points[points.length - 2];
  const hasAmounts = points.some(
    (point) => point.recordedRevenue !== 0 || point.totalCosts !== 0
  );

  return (
    <OpsSection
      description="Cobros y egresos registrados por mes asignado."
      title="Tendencia (3 meses)"
    >
      {trend.error ? (
        <DashboardSectionError
          description="No mostramos ceros porque la consulta de la tendencia falló."
          onRetry={trend.refetch}
          title="No pudimos cargar la tendencia"
        />
      ) : trend.isLoading ? (
        <Skeleton className="h-56 w-full md:h-64" />
      ) : !hasAmounts ? (
        <OpsEmptyState
          description="Cuando registres cobros o egresos en estos meses vas a ver la evolución acá."
          icon={ChartSpline}
          title="Todavía no hay movimientos en el período"
        />
      ) : (
        <>
          <FinanceTrendChart points={points} />
          <p className="sr-only">
            {points
              .map(
                (point) =>
                  `${point.monthKey}: cobrado ${formatCostMoney(point.recordedRevenue)}, egresos ${formatCostMoney(point.totalCosts)}, resultado ${formatCostMoney(point.realProfit)}.`
              )
              .join(" ")}
          </p>
          {current && previous ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <OpsMetricCard
                helper="vs mes anterior"
                label="Δ Cobrado"
                size="compact"
                tone={
                  current.recordedRevenue >= previous.recordedRevenue
                    ? "success"
                    : "warning"
                }
                value={formatDelta(current.recordedRevenue, previous.recordedRevenue)}
              />
              <OpsMetricCard
                helper="vs mes anterior"
                label="Δ Egresos"
                size="compact"
                tone={
                  current.totalCosts <= previous.totalCosts ? "success" : "warning"
                }
                value={formatDelta(current.totalCosts, previous.totalCosts)}
              />
              <OpsMetricCard
                helper="vs mes anterior"
                label="Δ Resultado"
                size="compact"
                tone={
                  current.realProfit >= previous.realProfit ? "success" : "danger"
                }
                value={formatDelta(current.realProfit, previous.realProfit)}
              />
            </div>
          ) : null}
        </>
      )}
    </OpsSection>
  );
};
