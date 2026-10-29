"use client";

import { useState } from "react";
import { FormProvider, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";

import { BudgetCreatorMobile } from "@/components/budgets/create-budget/budget-creator-mobile";
import { findStepWithError, type CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import { useIsPhone } from "@/components/budgets/create-budget/hooks/use-is-phone";
import { BudgetEditorDesktop } from "@/components/budgets/edit-budget/budget-editor-desktop";
import { BudgetOfficialNotice } from "@/components/budgets/edit-budget/budget-official-notice";
import { BudgetSlugField } from "@/components/budgets/edit-budget/budget-slug-field";
import { useBudgetEditor } from "@/components/budgets/edit-budget/hooks/use-budget-editor";
import type { ExistingBudget } from "@/components/budgets/interfaces/edit-buget";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

export const BudgetEditor = ({ budget }: { budget: ExistingBudget }) => {
  const editor = useBudgetEditor(budget);
  const isPhone = useIsPhone();
  const [step, setStep] = useState<CreatorStepId>("detalle");

  const onInvalid = (errors: FieldErrors<BudgetFormValues>) => {
    const stepWithError = findStepWithError(errors);
    if (stepWithError) setStep(stepWithError);
    toast.error("Revisá los campos marcados antes de guardar.");
  };
  const save = () => {
    if (!editor.changes.length) {
      toast.info("No hay cambios para guardar.");
      return;
    }
    editor.save(onInvalid);
  };

  return (
    <FormProvider {...editor.form}>
      {isPhone === null ? null : isPhone ? (
        <BudgetCreatorMobile
          backHref={`/dashboard/budgets/budget/${budget.slug}`}
          detailSlot={<BudgetSlugField onChange={editor.setSlug} value={editor.slug} />}
          heading={editor.changes.length ? `Editar · ${editor.changes.length} sin guardar` : "Editar"}
          isPending={editor.isPending}
          onSave={save}
          onStepChange={setStep}
          saveLabel="Guardar cambios"
          step={step}
          top={budget.officialBudget ? <BudgetOfficialNotice currentVersion={budget.officialBudget.currentVersion} /> : null}
        />
      ) : (
        <BudgetEditorDesktop budget={budget} editor={editor} onSave={save} />
      )}
    </FormProvider>
  );
};
