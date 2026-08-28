"use client";

import { useMemo } from "react";

import { FinancialActions } from "@/components/ops/financial/financial-actions";
import { FinancialCostsSection } from "@/components/ops/financial/financial-costs-section";
import { FinancialPaymentsSection } from "@/components/ops/financial/financial-payments-section";
import { FinancialProfitabilitySection } from "@/components/ops/financial/financial-profitability-section";
import { FinancialPayrollSection } from "@/components/ops/financial/financial-payroll-section";
import { FinancialSectionNav } from "@/components/ops/financial/financial-section-nav";
import { FinancialSummary } from "@/components/ops/financial/financial-summary";
import { useFinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { OpsPageHeader, OpsPageShell, OpsSection } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";
import { getFinancialSummary } from "@/lib/ops/finance";

export const FinancialPage = () => {
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
          <FinancialActions
            isProfitabilityFetching={profitabilityQuery.isFetching}
            onRefreshProfitability={profitabilityQuery.refetch}
            summary={summary}
            workspace={workspace}
          />
        }
        description="Cobros, costes y pagos a empleadas en un único espacio mensual."
        eyebrow="Operaciones"
        meta={
          <span className="rounded-full bg-[#EAF5EC] px-3 py-1 text-xs font-semibold capitalize text-[#244C2D] dark:bg-[#91AD71]/15 dark:text-[#D4E3B8]">
            {formatMonth(workspace.month)}
          </span>
        }
        title="Finanzas"
      />
      <FinancialSectionNav />
      <div className="scroll-mt-28" id="resumen">
        <OpsSection
          description="Los anulados permanecen en el historial, pero no afectan estos importes."
          title="Resumen financiero"
        >
          <FinancialSummary
            error={workspace.errors.summary}
            isLoading={workspace.loading.summary}
            onRetry={workspace.refresh.all}
            summary={summary}
          />
        </OpsSection>
      </div>
      <FinancialProfitabilitySection
        error={profitabilityQuery.error}
        isLoading={profitabilityQuery.isLoading}
        onRetry={profitabilityQuery.refetch}
        results={profitabilityQuery.profitability}
      />
      <FinancialPaymentsSection workspace={workspace} />
      <FinancialCostsSection workspace={workspace} />
      <FinancialPayrollSection workspace={workspace} />
    </OpsPageShell>
  );
};
