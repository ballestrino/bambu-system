"use client";

import { FinancialCostsSection } from "@/components/ops/financial/financial-costs-section";
import { FinancialPaymentsSection } from "@/components/ops/financial/financial-payments-section";
import { FinancialPayrollSection } from "@/components/ops/financial/financial-payroll-section";
import { FinancialProfitabilitySection } from "@/components/ops/financial/financial-profitability-section";
import { FinancialSummarySection } from "@/components/ops/financial/financial-summary-section";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import {
  financePanelId,
  financeTabId,
} from "@/components/ops/financial/financial-tabs";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import type { getFinancialSummary } from "@/lib/ops/finance";

export const FinancialSectionPanel = ({
  onSelectSection,
  section,
  summary,
  workspace,
}: {
  onSelectSection: (section: FinanceSection) => void;
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
      <FinancialSummarySection
        onSelectSection={onSelectSection}
        summary={summary}
        workspace={workspace}
      />
    ) : section === "rentabilidad" ? (
      <FinancialProfitabilitySection
        error={workspace.profitability.error}
        isLoading={workspace.profitability.isLoading}
        onRetry={workspace.profitability.refetch}
        results={workspace.profitability.results}
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
