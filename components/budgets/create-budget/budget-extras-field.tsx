"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { CreatorAffixInput, creatorInputClass } from "@/components/budgets/create-budget/creator-ui";
import { sumBudgetExtras } from "@/lib/budget-extras";
import { cn } from "@/lib/utils";
import { MAX_BUDGET_EXTRAS, type BudgetFormValues } from "@/schemas/BudgetSchema";

// Costos puntuales con nombre y monto. Las filas vacías se descartan al guardar.
export const BudgetExtrasField = () => {
  const { control, formState, register } = useFormContext<BudgetFormValues>();
  const { append, fields, remove } = useFieldArray({ control, name: "extras" });
  const total = sumBudgetExtras(useWatch({ control, name: "extras" }));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-ops-text">Extras</span>
        {total > 0 ? (
          <span className="text-[12.5px] font-semibold tabular-nums text-ops-text-muted">{formatBudgetMoney(total)} en el mes</span>
        ) : null}
      </div>
      {fields.map((field, index) => {
        const nameError = formState.errors.extras?.[index]?.name?.message;
        const position = index + 1;

        return (
          <div className="flex flex-col gap-1" key={field.id}>
            <div className="flex flex-wrap items-center gap-2 max-sm:rounded-xl max-sm:bg-ops-canvas max-sm:p-2.5 dark:max-sm:bg-ops-surface-muted">
              <input
                aria-invalid={Boolean(nameError)}
                aria-label={`Nombre del extra ${position}`}
                className={cn(creatorInputClass, "flex-[1_1_200px]")}
                placeholder="Ej: camión cisterna"
                {...register(`extras.${index}.name`)}
              />
              <CreatorAffixInput
                aria-label={`Monto del extra ${position}`}
                inputMode="decimal"
                min={0}
                onFocus={(event) => event.currentTarget.select()}
                prefix="$"
                type="number"
                wrapperClassName="min-w-[120px] flex-[1_1_150px] sm:flex-[0_1_170px]"
                {...register(`extras.${index}.amount`, { valueAsNumber: true })}
              />
              <button
                aria-label={`Quitar el extra ${position}`}
                className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-ops-border bg-ops-surface text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text"
                onClick={() => remove(index)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {nameError ? <p className="text-[12.5px] text-red-700 dark:text-red-300">{nameError}</p> : null}
          </div>
        );
      })}
      {fields.length < MAX_BUDGET_EXTRAS ? (
        <button
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-ops-border text-[13.5px] font-semibold text-ops-bamboo-strong hover:bg-ops-bamboo-soft"
          onClick={() => append({ amount: 0, name: "" })}
          type="button"
        >
          <Plus className="size-4" />
          Agregar extra
        </button>
      ) : null}
      <p className="text-[12.5px] text-ops-text-muted">
        Cualquier costo puntual del mes con nombre y monto: un camión cisterna, un alquiler, un permiso. Se suma al costo y lleva la ganancia del servicio.
      </p>
    </div>
  );
};
