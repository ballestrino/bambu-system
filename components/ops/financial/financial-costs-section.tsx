"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { CostDialog } from "@/components/ops/costs/cost-dialog";
import {
  CostsFilters,
  type CostsFilterState,
} from "@/components/ops/costs/costs-filters";
import { FinancialCostSettingsSheet } from "@/components/ops/financial/financial-cost-settings-sheet";
import { FinancialCostsTable } from "@/components/ops/financial/financial-costs-table";
import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useOperationalCostMutations } from "@/components/ops/hooks/useOperationalCostMutations";
import { OpsSection } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";

const defaultFilters: CostsFilterState = {
  categoryId: "ALL",
  employeeId: "ALL",
  jobId: "ALL",
  status: "RECORDED",
};

export const FinancialCostsSection = ({ workspace }: { workspace: FinancialWorkspace }) => {
  const [filters, setFilters] = useState<CostsFilterState>(defaultFilters);
  const [query, setQuery] = useState("");
  const { voidCostAsync } = useOperationalCostMutations();
  const visibleCosts = useMemo(
    () =>
      workspace.costs.filter(
        (cost) =>
          (filters.categoryId === "ALL" || cost.categoryId === filters.categoryId) &&
          (filters.employeeId === "ALL" || cost.employeeId === filters.employeeId) &&
          (filters.jobId === "ALL" || cost.jobId === filters.jobId) &&
          (filters.status === "ALL" || cost.status === (filters.status as PaymentStatus))
      ),
    [filters, workspace.costs]
  );
  const monthLabel = formatMonth(workspace.month);

  return (
    <OpsSection
      actions={
        <>
          <FinancialCostSettingsSheet workspace={workspace} />
          <CostDialog
            categories={workspace.categories}
            employees={workspace.employees}
            jobs={workspace.jobs}
          />
        </>
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
        monthLabel={monthLabel}
        onChange={(values) => setFilters((current) => ({ ...current, ...values }))}
        onClear={() => {
          setFilters(defaultFilters);
          setQuery("");
        }}
        onRefresh={workspace.refresh.costs}
        search={{
          onChange: setQuery,
          placeholder: "Buscar categoría, trabajo o empleada",
          value: query,
        }}
      />
      <div className="mt-5">
        {workspace.errors.costs ? (
          <FinancialErrorState onRetry={workspace.refresh.costs} />
        ) : (
          <FinancialCostsTable
            caption={`Costes asignados a ${monthLabel}`}
            categories={workspace.categories}
            costs={visibleCosts}
            employees={workspace.employees}
            isLoading={workspace.loading.costs}
            jobs={workspace.jobs}
            onClearQuery={() => setQuery("")}
            onVoid={async (costId) => {
              await voidCostAsync(costId);
            }}
            query={query}
            resetKey={[filters.categoryId, filters.employeeId, filters.jobId, filters.status].join("|")}
            showStatus={filters.status !== "RECORDED"}
          />
        )}
      </div>
    </OpsSection>
  );
};
