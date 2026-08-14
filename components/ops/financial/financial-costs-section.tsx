"use client";

import { useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { BpsSettingsPanel } from "@/components/ops/costs/bps-settings-panel";
import { CostCategoriesPanel } from "@/components/ops/costs/cost-categories-panel";
import { CostDialog } from "@/components/ops/costs/cost-dialog";
import {
  CostsFilters,
  type CostsFilterState,
} from "@/components/ops/costs/costs-filters";
import { CostsList } from "@/components/ops/costs/costs-list";
import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useOperationalCostMutations } from "@/components/ops/hooks/useOperationalCostMutations";
import { OpsScrollContainer, OpsSection } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";

const defaultFilters: CostsFilterState = {
  categoryId: "ALL",
  employeeId: "ALL",
  jobId: "ALL",
  status: "RECORDED",
};

export const FinancialCostsSection = ({ workspace }: { workspace: FinancialWorkspace }) => {
  const [filters, setFilters] = useState<CostsFilterState>(defaultFilters);
  const { voidCostAsync } = useOperationalCostMutations();
  const visibleCosts = workspace.costs.filter(
    (cost) =>
      (filters.categoryId === "ALL" || cost.categoryId === filters.categoryId) &&
      (filters.employeeId === "ALL" || cost.employeeId === filters.employeeId) &&
      (filters.jobId === "ALL" || cost.jobId === filters.jobId) &&
      (filters.status === "ALL" || cost.status === (filters.status as PaymentStatus))
  );

  return (
    <div className="scroll-mt-28" id="costes">
      <OpsSection
        actions={
          <CostDialog
            categories={workspace.categories}
            employees={workspace.employees}
            jobs={workspace.jobs}
          />
        }
        description="Costes reales, categorías operativas y configuración de BPS."
        title="Costes"
      >
        <CostsFilters
          categories={workspace.categories}
          employees={workspace.employees}
          filters={filters}
          isRefreshing={workspace.isFetching}
          jobs={workspace.jobs}
          monthLabel={formatMonth(workspace.month)}
          onChange={(values) => setFilters((current) => ({ ...current, ...values }))}
          onClear={() => setFilters(defaultFilters)}
          onRefresh={workspace.refresh.costs}
        />
        <div className="mt-5">
          {workspace.errors.costs ? (
            <FinancialErrorState onRetry={workspace.refresh.costs} />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
              <OpsSection title="Costes registrados">
                <OpsScrollContainer>
                  <CostsList
                    categories={workspace.categories}
                    costs={visibleCosts}
                    employees={workspace.employees}
                    isLoading={workspace.loading.costs}
                    jobs={workspace.jobs}
                    onVoid={async (costId) => {
                      await voidCostAsync(costId);
                    }}
                  />
                </OpsScrollContainer>
              </OpsSection>
              <div className="grid content-start gap-5">
                <BpsSettingsPanel settings={workspace.settings} />
                <CostCategoriesPanel categories={workspace.categories} scrollable />
              </div>
            </div>
          )}
        </div>
      </OpsSection>
    </div>
  );
};
