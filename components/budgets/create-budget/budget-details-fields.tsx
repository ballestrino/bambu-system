"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Plus, RefreshCw } from "lucide-react";

import { CreateBudgetCategoryDialog } from "@/components/budgets/categories/CreateBudgetCategoryDialog";
import useBudgetCategories from "@/components/budgets/categories/hooks/useBudgetCategories";
import { CreatorField, creatorInputClass } from "@/components/budgets/create-budget/creator-ui";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

const smallButton =
  "inline-flex h-9 items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] font-semibold text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text";

export const BudgetDetailsFields = ({ children }: { children?: ReactNode }) => {
  const { control, formState, getValues, register, setValue } = useFormContext<BudgetFormValues>();
  const { categories, isRefetching, refetch } = useBudgetCategories();
  const nameError = formState.errors.name ? "Poné un nombre al presupuesto." : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CreatorField error={nameError} htmlFor="budget-name" label="Nombre">
          <input
            aria-invalid={Boolean(nameError)}
            className={creatorInputClass}
            id="budget-name"
            placeholder="Ej: Limpieza oficinas Pocitos"
            {...register("name")}
          />
        </CreatorField>
        <CreatorField
          htmlFor="budget-description"
          label={
            <>
              Descripción <span className="font-normal text-ops-text-muted">(opcional)</span>
            </>
          }
        >
          <input className={creatorInputClass} id="budget-description" placeholder="Detalles extra" {...register("description")} />
        </CreatorField>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-ops-text">Categorías</span>
          <div className="flex gap-1">
            <button className={smallButton} onClick={() => void refetch()} type="button">
              <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} />
              Refrescar
            </button>
            <CreateBudgetCategoryDialog
              onCreated={(category) =>
                setValue("categoryIds", [...(getValues("categoryIds") ?? []), category.id], { shouldDirty: true })
              }
              trigger={
                <button className={smallButton} type="button">
                  <Plus className="size-3.5" />
                  Categoría
                </button>
              }
            />
          </div>
        </div>
        <Controller
          control={control}
          name="categoryIds"
          render={({ field }) => (
            <MultiSelect
              onChange={field.onChange}
              options={categories?.map((category) => ({ label: category.name, value: category.id })) ?? []}
              placeholder="Elegí categorías"
              selected={field.value ?? []}
            />
          )}
        />
      </div>
      {children}
    </div>
  );
};
