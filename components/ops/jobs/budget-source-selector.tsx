"use client";

import { Briefcase, Package2 } from "lucide-react";

import { useBudgetSources } from "@/components/ops/hooks/useBudgetSources";
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
  const { budgetSources, isLoading } = useBudgetSources();
  const selectedBudget = budgetSources.find((budget) => budget.id === sourceBudgetId);
  const selectedOption = selectedBudget?.budgetOptions.find(
    (option) => option.id === sourceBudgetOptionId
  );

  return (
    <div className={opsFormPanelClass}>
      <OpsFormField label="Presupuesto base">
        <Select
          value={sourceBudgetId || "none"}
          onValueChange={(value) => {
            const nextBudgetId = value === "none" ? "" : value;
            onBudgetChange(nextBudgetId);
            onOptionChange("");
          }}
        >
          <SelectTrigger className={opsFormSelectTriggerClass}>
            <SelectValue placeholder={isLoading ? "Cargando..." : "Sin presupuesto"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin presupuesto</SelectItem>
            {budgetSources.map((budget) => (
              <SelectItem key={budget.id} value={budget.id}>
                {budget.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
