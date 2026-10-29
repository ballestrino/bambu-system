"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { dropEmptyExtras, useBudgetPriceSync } from "@/components/budgets/create-budget/hooks/use-budget-form-helpers";
import { listBudgetChanges, type BudgetEditChange } from "@/components/budgets/edit-budget/budget-edit-changes";
import { useUpdateBudgetMutation } from "@/components/budgets/hooks/useUpdateBudgetMutation";
import type { ExistingBudget } from "@/components/budgets/interfaces/edit-buget";
import { budgetOptionToFormValues } from "@/lib/agent/budget-calculation";
import { BudgetSchema, type BudgetFormValues } from "@/schemas/BudgetSchema";

// El editor parte de la opción con productos (o la única), como el agente y la
// edición anterior, y compara contra lo último guardado.
export const useBudgetEditor = (budget: ExistingBudget) => {
  const router = useRouter();
  const { isUpdating, updateBudgetAsync } = useUpdateBudgetMutation();
  const initialValues = useMemo(() => budgetOptionToFormValues(budget), [budget]);
  const form = useForm<BudgetFormValues>({
    defaultValues: initialValues,
    mode: "onChange",
    resolver: zodResolver(BudgetSchema) as unknown as Resolver<BudgetFormValues>,
  });
  const [savedSlug, setSavedSlug] = useState(budget.slug);
  const [slug, setSlug] = useState(budget.slug);
  useBudgetPriceSync(form);

  const values = useWatch({ control: form.control });
  const savedValues = (form.formState.defaultValues ?? initialValues) as Partial<BudgetFormValues>;
  const changes = listBudgetChanges(savedValues, values, savedSlug, slug);

  const discard = () => {
    form.reset();
    setSlug(savedSlug);
  };
  const undo = (change: BudgetEditChange) => {
    if (change.field === "slug") setSlug(savedSlug);
    else form.resetField(change.field);
  };

  const submit = async (data: BudgetFormValues) => {
    const updated = await updateBudgetAsync({ id: budget.id, slug: slug.trim(), values: data }).catch(() => null);
    if (!updated) return;
    form.reset(data);
    setSavedSlug(updated.slug);
    setSlug(updated.slug);
    // La página vuelve a leer el presupuesto: la versión oficial y la URL nuevas.
    if (updated.slug !== budget.slug) router.replace(`/dashboard/budgets/edit/${updated.slug}`);
    else router.refresh();
  };

  const save = (onInvalid: (errors: FieldErrors<BudgetFormValues>) => void) => {
    dropEmptyExtras(form);
    void form.handleSubmit(submit, onInvalid)();
  };

  return { changes, discard, form, isPending: isUpdating, save, savedValues, setSlug, slug, undo };
};

export type BudgetEditorState = ReturnType<typeof useBudgetEditor>;
