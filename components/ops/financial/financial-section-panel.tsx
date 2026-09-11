"use client";

import { FinancialCostsSection } from "@/components/ops/financial/financial-costs-section";
import { FinancialPaymentsSection } from "@/components/ops/financial/financial-payments-section";
import { FinancialPayrollSection } from "@/components/ops/financial/financial-payroll-section";
import { FinancialProfitabilitySection } from "@/components/ops/financial/financial-profitability-section";
import { FinancialSummary } from "@/components/ops/financial/financial-summary";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import {
  financePanelId,
  financeTabId,
} from "@/components/ops/financial/financial-tabs";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { OpsSection } from "@/components/ops/shared";
import type { getFinancialSummary } from "@/lib/ops/finance";
import type { JobProfitability } from "@/lib/ops/profitability";

type ProfitabilityState = {
  error: unknown;
  isLoading: boolean;
  refetch: () => Promise<unknown> | void;
  results: JobProfitability[];
};

export const FinancialSectionPanel = ({
  profitability,
  section,
  summary,
  workspace,
}: {
  profitability: ProfitabilityState;
  section: FinanceSection;
  summary: ReturnType<typeof getFinancialSummary>;
  workspace: FinancialWorkspace;
}) => (
  <div
    aria-labelledby={financeTabId(section)}
    className="focus-visible:outline-none"
    id={financePanelId(section)}
    role="tabpanel"
    tabIndex={0}
  >
    {section === "resumen" ? (
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
    ) : section === "rentabilidad" ? (
      <FinancialProfitabilitySection
        error={profitability.error}
        isLoading={profitability.isLoading}
        onRetry={profitability.refetch}
        results={profitability.results}
      />
    ) : section === "cobros" ? (
      <FinancialPaymentsSection workspace={workspace} />
    ) : section === "costes" ? (
      <FinancialCostsSection workspace={workspace} />
    ) : (
      <FinancialPayrollSection workspace={workspace} />
    )}
  </div>
);
