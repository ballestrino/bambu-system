"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import {
  financeCostChartConfig,
  financeCostSliceColor,
} from "@/components/ops/financial/finance-chart-config";
import type { CostBreakdownRow } from "@/components/ops/financial/financial-cost-breakdown-data";
import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const FinanceCostChart = ({ rows }: { rows: CostBreakdownRow[] }) => (
  <ChartContainer
    aria-label="Egresos del mes por categoria"
    className="h-56 w-full"
    config={financeCostChartConfig}
  >
    <BarChart
      data={rows}
      layout="vertical"
      margin={{ left: 4, right: 12, top: 4 }}
    >
      <XAxis hide type="number" />
      <YAxis
        axisLine={false}
        dataKey="name"
        tickLine={false}
        type="category"
        width={104}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value) => (
              <span className="font-medium tabular-nums">
                {formatCostMoney(Number(value))}
              </span>
            )}
            hideLabel={false}
          />
        }
      />
      <Bar dataKey="amount" radius={4}>
        {rows.map((row, index) => (
          // The stored category colour is user-chosen and has no dark-mode
          // counterpart, so bars use chart tokens; the real colour stays as the
          // dot beside the label, like in cost-categories-panel.
          <Cell fill={financeCostSliceColor(index)} key={row.name} />
        ))}
      </Bar>
    </BarChart>
  </ChartContainer>
);
