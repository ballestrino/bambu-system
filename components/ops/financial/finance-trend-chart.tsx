"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import {
  financeTrendChartConfig,
  formatTrendMonthLabel,
} from "@/components/ops/financial/finance-chart-config";
import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { FinanceTrendPoint } from "@/lib/ops/finance";

export const FinanceTrendChart = ({
  points,
}: {
  points: FinanceTrendPoint[];
}) => (
  <ChartContainer
    aria-label="Evolución de cobros, egresos y resultado en los últimos tres meses"
    className="h-56 w-full md:h-64"
    config={financeTrendChartConfig}
  >
    <ComposedChart data={points} margin={{ left: 4, right: 4, top: 8 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis
        axisLine={false}
        dataKey="monthKey"
        tickFormatter={formatTrendMonthLabel}
        tickLine={false}
        tickMargin={8}
      />
      {/* Hidden on purpose: UYU amounts are long enough to eat the plot, and the
          exact numbers live in the hero cards and the tooltip. */}
      <YAxis hide />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value, name) => (
              <span className="flex w-full justify-between gap-4">
                <span className="text-ops-text-muted">
                  {financeTrendChartConfig[
                    name as keyof typeof financeTrendChartConfig
                  ]?.label ?? name}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCostMoney(Number(value))}
                </span>
              </span>
            )}
            labelFormatter={(label) => formatTrendMonthLabel(String(label))}
          />
        }
      />
      <Bar
        dataKey="recordedRevenue"
        fill="var(--color-recordedRevenue)"
        maxBarSize={28}
        radius={[4, 4, 0, 0]}
      />
      <Bar
        dataKey="employeePaymentsTotal"
        fill="var(--color-employeePaymentsTotal)"
        maxBarSize={28}
        stackId="egresos"
      />
      <Bar
        dataKey="manualCostsTotal"
        fill="var(--color-manualCostsTotal)"
        maxBarSize={28}
        radius={[4, 4, 0, 0]}
        stackId="egresos"
      />
      <Line
        dataKey="realProfit"
        dot={{ r: 3 }}
        stroke="var(--color-realProfit)"
        strokeWidth={2}
        type="monotone"
      />
      <ChartLegend content={<ChartLegendContent />} />
    </ComposedChart>
  </ChartContainer>
);
