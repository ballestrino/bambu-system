"use client";

import { useEffect } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { calculateBudgetTotals } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// El precio guardado es el final con productos, como el formulario anterior.
export const useBudgetPriceSync = (form: UseFormReturn<BudgetFormValues>) => {
  const values = useWatch({ control: form.control });

  useEffect(() => {
    const price = Number(calculateBudgetTotals(values).totalFinalWithProducts.toFixed(2));
    if (form.getValues("price") !== price) form.setValue("price", price);
  }, [form, values]);
};

// Un extra sin nombre y sin monto es una fila que se agregó y no se usó.
export const dropEmptyExtras = (form: UseFormReturn<BudgetFormValues>) => {
  const extras = form.getValues("extras") ?? [];
  const kept = extras.filter((extra) => String(extra.name ?? "").trim() || Number(extra.amount) > 0);
  if (kept.length !== extras.length) form.setValue("extras", kept);
};
