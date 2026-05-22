"use client";

import { useState } from "react";
import { Briefcase, Package2 } from "lucide-react";

import { useBudgetSources } from "@/components/ops/hooks/useBudgetSources";
import { BudgetSourceCombobox } from "@/components/ops/jobs/budget-source-combobox";
import { useOpsDebouncedValue } from "@/components/ops/shared/use-ops-debounced-value";
import {
  OpsFormField,
  opsFormControlClass,
  opsFormPanelClass,
  opsFormSelectTriggerClass,
} from "@/components/ops/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BudgetSourceSelectorProps {
  sourceBudgetId: string;
  sourceBudgetOptionId: string;
  onBudgetChange: (budgetId: string) => void;
  onOptionChange: (budgetOptionId: string) => void;
}

export const BudgetSourceSelector = ({
  sourceBudgetId,
  sourceBudgetOptionId,
  onBudgetChange,
  onOptionChange,
}: BudgetSourceSelectorProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useOpsDebouncedValue(search, 300);
  const {
    budgetSources,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useBudgetSources({
    query: debouncedSearch,
    selectedBudgetId: sourceBudgetId || undefined,
  });
  const selectedBudget = budgetSources.find((budget) => budget.id === sourceBudgetId);
  const selectedOption = selectedBudget?.budgetOptions.find(
    (option) => option.id === sourceBudgetOptionId
  );

  return (
    <div className={opsFormPanelClass}>
      <OpsFormField label="Presupuesto base">
        <BudgetSourceCombobox
          budgetSources={budgetSources}
          fetchNextPage={() => void fetchNextPage()}
          hasNextPage={hasNextPage}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
          onBudgetChange={onBudgetChange}
          onOptionChange={onOptionChange}
          onSearchChange={setSearch}
          search={search}
          selectedBudget={selectedBudget}
          sourceBudgetId={sourceBudgetId}
        />
      </OpsFormField>

      <OpsFormField className="mt-4" label="Opción del presupuesto">
        <Select
          value={sourceBudgetOptionId || "none"}
          onValueChange={(value) => onOptionChange(value === "none" ? "" : value)}
          disabled={!selectedBudget}
        >
          <SelectTrigger className={opsFormSelectTriggerClass}>
            <SelectValue placeholder="Sin opción seleccionada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin opción</SelectItem>
            {selectedBudget?.budgetOptions.map((option, index) => (
              <SelectItem key={option.id} value={option.id}>
                Opción {index + 1} · ${option.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OpsFormField>

      {selectedBudget ? (
        <div className="mt-4 grid gap-3 rounded-md border border-[#53985E]/15 bg-white/70 p-3 text-sm md:grid-cols-2 dark:bg-background/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Briefcase className="h-4 w-4" />
              {selectedBudget.name}
            </div>
            <Input className={opsFormControlClass} readOnly value={selectedBudget.slug} />
          </div>
          {selectedOption ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <Package2 className="h-4 w-4" />
                Opción vinculada
              </div>
              <p className="text-muted-foreground">
                ${selectedOption.price} · {selectedOption.visits} visitas ·{" "}
                {selectedOption.hours_per_visit} hs/visita
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground md:self-end">
              El trabajo usará solo el snapshot del presupuesto.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};
