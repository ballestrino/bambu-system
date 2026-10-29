"use client";

import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Calculator, Package } from "lucide-react";

import { BudgetExtrasField } from "@/components/budgets/create-budget/budget-extras-field";
import { formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import {
  CreatorAffixInput,
  CreatorField,
  creatorOutlineButtonClass,
  CreatorSwitch,
} from "@/components/budgets/create-budget/creator-ui";
import { calculateEffectiveVisits, calculateEstimates, PRODUCT_MARGIN_PCT } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

const setOptions = { shouldDirty: true, shouldValidate: true } as const;

export const BudgetCostsFields = () => {
  const { control, getValues, register, setValue } = useFormContext<BudgetFormValues>();
  const [visits, visitType, employees, productMargin] = useWatch({
    control,
    name: ["visits", "visit_type", "employees", "products_revenue_percent"],
  });
  const [includeProducts, setIncludeProducts] = useState(() => Number(getValues("products_price")) > 0);
  const lastProductsPrice = useRef(Number(getValues("products_price")) || 0);
  const effectiveVisits = calculateEffectiveVisits(Number(visits) || 0, visitType ?? "week");
  const people = Math.max(1, Number(employees) || 1);

  const estimateTransport = () =>
    setValue("transportation_cost", calculateEstimates(getValues()).transportation_cost, setOptions);
  const estimateProducts = () =>
    setValue("products_price", calculateEstimates(getValues()).products_price, setOptions);
  // Apagar los productos guarda el costo para volver a prenderlos sin perderlo.
  const toggleProducts = (checked: boolean) => {
    setIncludeProducts(checked);
    if (!checked) {
      lastProductsPrice.current = Number(getValues("products_price")) || 0;
      setValue("products_price", 0, setOptions);
      return;
    }
    if (lastProductsPrice.current > 0) setValue("products_price", lastProductsPrice.current, setOptions);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <CreatorField
        hint={`${formatBudgetNumber(effectiveVisits)} visitas × ${people} ${people === 1 ? "persona" : "personas"} × $ 52 de boleto.`}
        htmlFor="budget-transport"
        label="Transporte del mes"
      >
        <div className="flex gap-2">
          <CreatorAffixInput
            id="budget-transport"
            inputMode="decimal"
            min={0}
            prefix="$"
            type="number"
            wrapperClassName="flex-1"
            {...register("transportation_cost", { valueAsNumber: true })}
          />
          <button className={creatorOutlineButtonClass} onClick={estimateTransport} type="button">
            <Calculator className="size-4" />
            Calcular
          </button>
        </div>
      </CreatorField>
      <BudgetExtrasField />
      <div className="overflow-hidden rounded-xl border border-ops-border">
        <div className="flex items-center gap-3 bg-ops-canvas p-3.5 dark:bg-ops-surface-muted">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ops-surface text-ops-bamboo-strong">
            <Package className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ops-text">Incluye productos</p>
            <p className="text-[12.5px] text-ops-text-muted">Se arma una segunda opción con productos para comparar con el servicio solo.</p>
          </div>
          <CreatorSwitch aria-label="Incluye productos" checked={includeProducts} onCheckedChange={toggleProducts} />
        </div>
        {includeProducts ? (
          <div className="grid gap-4 border-t border-ops-border p-3.5 sm:grid-cols-2">
            <CreatorField htmlFor="budget-products" label="Costo de productos">
              <div className="flex gap-2">
                <CreatorAffixInput
                  id="budget-products"
                  inputMode="decimal"
                  min={0}
                  prefix="$"
                  type="number"
                  wrapperClassName="flex-1"
                  {...register("products_price", { valueAsNumber: true })}
                />
                <button aria-label="Calcular productos" className={`${creatorOutlineButtonClass} w-11 px-0`} onClick={estimateProducts} type="button">
                  <Calculator className="size-4" />
                </button>
              </div>
            </CreatorField>
            <div className="flex min-h-11 items-center gap-3 self-end">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ops-text">Ganancia sobre productos</p>
                <p className="text-[12.5px] text-ops-text-muted">
                  {Number(productMargin) > 0 ? `${formatBudgetNumber(Number(productMargin))}% sobre el costo` : "Apagada: se cobran al costo"}
                </p>
              </div>
              <CreatorSwitch
                aria-label="Ganancia sobre productos"
                checked={Number(productMargin) > 0}
                onCheckedChange={(checked) => setValue("products_revenue_percent", checked ? PRODUCT_MARGIN_PCT : 0, setOptions)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
