"use client";

import { FinancialCostsSection } from "@/components/ops/financial/financial-costs-section";
import { FinancialPaymentsSection } from "@/components/ops/financial/financial-payments-section";
import { FinancialPayrollSection } from "@/components/ops/financial/financial-payroll-section";
import { FinancialProfitabilitySection } from "@/components/ops/financial/financial-profitability-section";
import { FinancialSummarySection } from "@/components/ops/financial/financial-summary-section";
import {
  resolveFinanceView,
  type FinanceSection,
  type FinanceSectionSelect,
} from "@/components/ops/financial/financial-sections";
import {
  financePanelId,
  financeTabId,
} from "@/components/ops/financial/financial-tabs";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import type { getFinancialSummary } from "@/lib/ops/finance";

export const FinancialSectionPanel = ({
  onSelectSection,
  onViewChange,
  section,
  summary,
  view,
  workspace,
}: {
  onSelectSection: FinanceSectionSelect;
  onViewChange: (view: string) => void;
  section: FinanceSection;
  summary: ReturnType<typeof getFinancialSummary>;
  view: string | null;
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
      <FinancialPaymentsSection
        onViewChange={onViewChange}
        view={resolveFinanceView("cobros", view)}
        workspace={workspace}
      />
    ) : section === "costes" ? (
      <FinancialCostsSection workspace={workspace} />
    ) : (
      <FinancialPayrollSection
        onViewChange={onViewChange}
        view={resolveFinanceView("pagos", view)}
        workspace={workspace}
      />
    )}
  </div>
);
