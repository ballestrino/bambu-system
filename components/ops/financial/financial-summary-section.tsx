"use client";

import { useMemo } from "react";

import { getDashboardFinancials } from "@/components/ops/dashboard/dashboard-financials";
import { FinancialAttentionPanel } from "@/components/ops/financial/financial-attention-panel";
import {
  buildAttentionItems,
  countVoided,
} from "@/components/ops/financial/financial-attention-items";
import { FinancialBpsPanel } from "@/components/ops/financial/financial-bps-panel";
import { FinancialCostBreakdownPanel } from "@/components/ops/financial/financial-cost-breakdown-panel";
import { buildCostBreakdown } from "@/components/ops/financial/financial-cost-breakdown-data";
import { FinancialHeroMetrics } from "@/components/ops/financial/financial-hero-metrics";
import { FinancialQuickActions } from "@/components/ops/financial/financial-quick-actions";
import { FinancialTeamRevenuePanel } from "@/components/ops/financial/financial-team-revenue-panel";
import { FinancialTrendPanel } from "@/components/ops/financial/financial-trend-panel";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import type { getFinancialSummary } from "@/lib/ops/finance";

export const FinancialSummarySection = ({
  onSelectSection,
  summary,
  workspace,
}: {
  onSelectSection: (section: FinanceSection) => void;
  summary: ReturnType<typeof getFinancialSummary>;
  workspace: FinancialWorkspace;
}) => {
  const projections = useMemo(
    () =>
      getDashboardFinancials({
        bpsEstimatePercent: Number(workspace.settings?.bpsEstimatePercent ?? 0),
        clientPayments: workspace.clientPayments,
        employeePayments: workspace.employeePayments,
        jobs: workspace.jobs,
        operationalCosts: workspace.costs,
      }),
    [
      workspace.clientPayments,
      workspace.costs,
      workspace.employeePayments,
      workspace.jobs,
      workspace.settings?.bpsEstimatePercent,
    ]
  );
  const costRows = useMemo(
    () =>
      buildCostBreakdown({
        costs: workspace.costs,
        employeePaymentsTotal: summary.employeePaymentsTotal,
      }),
    [summary.employeePaymentsTotal, workspace.costs]
  );
  const attentionItems = useMemo(
    () =>
      buildAttentionItems({
        summary,
        voidedCount: countVoided(
          workspace.clientPayments,
          workspace.costs,
          workspace.employeePayments
        ),
      }),
    [summary, workspace.clientPayments, workspace.costs, workspace.employeePayments]
  );

  return (
    <div className="flex flex-col gap-4">
      <FinancialHeroMetrics
        projectedProfit={projections.projectedProfit}
        projectedRevenue={projections.projectedRevenue}
        summary={summary}
        workspace={workspace}
      />
      {/* minmax(0,...) is load-bearing: recharts' ResponsiveContainer inside a
          default 1fr track ratchets its width up and never shrinks back. */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <FinancialTrendPanel trend={workspace.trend} />
          <FinancialCostBreakdownPanel rows={costRows} workspace={workspace} />
          <FinancialBpsPanel summary={summary} />
        </div>
        <div className="grid content-start gap-4">
          <FinancialQuickActions
            onSelectSection={onSelectSection}
            workspace={workspace}
          />
          <FinancialAttentionPanel
            items={attentionItems}
            onSelectSection={onSelectSection}
            workspace={workspace}
          />
          <FinancialTeamRevenuePanel
            onSelectSection={onSelectSection}
            workspace={workspace}
          />
        </div>
      </div>
    </div>
  );
};
