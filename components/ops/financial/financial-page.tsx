"use client";

import { useMemo } from "react";

import { FinancialExportButton } from "@/components/ops/financial/financial-export-button";
import { FinancialSectionPanel } from "@/components/ops/financial/financial-section-panel";
import { FinancialTabs } from "@/components/ops/financial/financial-tabs";
import { useFinancialSection } from "@/components/ops/financial/use-financial-section";
import { useFinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import {
  OpsPageHeader,
  OpsPageShell,
  OpsRefreshButton,
} from "@/components/ops/shared";
import { getFinancialSummary } from "@/lib/ops/finance";

export const FinancialPage = () => {
  const { section, setSection } = useFinancialSection();
  const workspace = useFinancialWorkspace();
  const profitabilityQuery = useJobProfitability({
    mode: "MONTH",
    month: workspace.month,
  });
  const summary = useMemo(
    () =>
      getFinancialSummary({
        bpsEstimatePercent: Number(workspace.settings?.bpsEstimatePercent ?? 0),
        clientPayments: workspace.clientPayments,
        employeePayments: workspace.employeePayments,
        operationalCosts: workspace.costs,
      }),
    [
      workspace.clientPayments,
      workspace.costs,
      workspace.employeePayments,
      workspace.settings?.bpsEstimatePercent,
    ]
  );

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={
          <>
            <FinancialExportButton summary={summary} workspace={workspace} />
            <OpsRefreshButton
              isRefreshing={workspace.isFetching || profitabilityQuery.isFetching}
              onRefresh={async () => {
                await Promise.all([
                  workspace.refresh.all(),
                  profitabilityQuery.refetch(),
                ]);
              }}
            />
          </>
        }
        description="Cobros, costes y pagos a empleadas en un único espacio mensual."
        eyebrow="Operaciones"
        title="Finanzas"
      />
      <FinancialTabs onSectionChange={setSection} section={section} />
      <FinancialSectionPanel
        profitability={{
          error: profitabilityQuery.error,
          isLoading: profitabilityQuery.isLoading,
          refetch: profitabilityQuery.refetch,
          results: profitabilityQuery.profitability,
        }}
        section={section}
        summary={summary}
        workspace={workspace}
      />
    </OpsPageShell>
  );
};
