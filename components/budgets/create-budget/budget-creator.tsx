"use client";

import { useState } from "react";
import { FormProvider, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";

import { BudgetCreatorDesktop } from "@/components/budgets/create-budget/budget-creator-desktop";
import { BudgetCreatorMobile } from "@/components/budgets/create-budget/budget-creator-mobile";
import { findStepWithError, type CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import useCreateBudgetForm from "@/components/budgets/create-budget/hooks/useCreateBudgetForm";
import { dropEmptyExtras, useBudgetPriceSync } from "@/components/budgets/create-budget/hooks/use-budget-form-helpers";
import { useIsPhone } from "@/components/budgets/create-budget/hooks/use-is-phone";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

export const BudgetCreator = () => {
  const { form, isPending, onSubmit } = useCreateBudgetForm();
  const isPhone = useIsPhone();
  const [step, setStep] = useState<CreatorStepId>("detalle");
  useBudgetPriceSync(form);

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
