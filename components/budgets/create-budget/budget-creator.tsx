"use client";

import { useEffect, useState } from "react";
import { FormProvider, useWatch, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { BudgetCreatorDesktop } from "@/components/budgets/create-budget/budget-creator-desktop";
import { BudgetCreatorMobile } from "@/components/budgets/create-budget/budget-creator-mobile";
import { findStepWithError, type CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import useCreateBudgetForm from "@/components/budgets/create-budget/hooks/useCreateBudgetForm";
import { useIsPhone } from "@/components/budgets/create-budget/hooks/use-is-phone";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// El precio guardado es el final con productos, como el formulario anterior.
const usePriceSync = (form: UseFormReturn<BudgetFormValues>) => {
  const values = useWatch({ control: form.control });

  useEffect(() => {
    const price = Number(calculateBudgetTotals(values).totalFinalWithProducts.toFixed(2));
    if (form.getValues("price") !== price) form.setValue("price", price);
  }, [form, values]);
};

// Un extra sin nombre y sin monto es una fila que se agregó y no se usó.
const dropEmptyExtras = (form: UseFormReturn<BudgetFormValues>) => {
  const extras = form.getValues("extras") ?? [];
  const kept = extras.filter((extra) => String(extra.name ?? "").trim() || Number(extra.amount) > 0);
  if (kept.length !== extras.length) form.setValue("extras", kept);
};

export const BudgetCreator = () => {
  const { form, isPending, onSubmit } = useCreateBudgetForm();
  const isPhone = useIsPhone();
  const [step, setStep] = useState<CreatorStepId>("detalle");
  usePriceSync(form);

  const onInvalid = (errors: FieldErrors<BudgetFormValues>) => {
    const stepWithError = findStepWithError(errors);
    if (stepWithError) setStep(stepWithError);
    toast.error("Revisá los campos marcados antes de guardar.");
  };
  const save = () => {
    dropEmptyExtras(form);
    void form.handleSubmit(onSubmit, onInvalid)();
  };

  return (
    <FormProvider {...form}>
      {isPhone === null ? null : isPhone ? (
        <BudgetCreatorMobile isPending={isPending} onSave={save} onStepChange={setStep} step={step} />
      ) : (
        <BudgetCreatorDesktop isPending={isPending} onSave={save} />
      )}
    </FormProvider>
  );
};
