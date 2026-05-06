"use client";

import { Briefcase, Package2 } from "lucide-react";

import { useBudgetSources } from "@/components/ops/hooks/useBudgetSources";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>Presupuesto base</Label>
        <Select
          value={sourceBudgetId || "none"}
          onValueChange={(value) => {
            const nextBudgetId = value === "none" ? "" : value;
            onBudgetChange(nextBudgetId);
            onOptionChange("");
          }}
        >
          <SelectTrigger className="w-full">
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
      </div>

      <div className="space-y-2">
        <Label>Opción del presupuesto</Label>
        <Select
          value={sourceBudgetOptionId || "none"}
          onValueChange={(value) => onOptionChange(value === "none" ? "" : value)}
          disabled={!selectedBudget}
        >
          <SelectTrigger className="w-full">
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
      </div>

      {selectedBudget ? (
        <div className="grid gap-3 rounded-md bg-muted/50 p-3 text-sm md:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Briefcase className="h-4 w-4" />
              {selectedBudget.name}
            </div>
            <Input readOnly value={selectedBudget.slug} />
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
