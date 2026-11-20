"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { CreatorStepFields } from "@/components/budgets/create-budget/creator-step-fields";
import { CREATOR_STEPS, type CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import { BudgetEditSection } from "@/components/budgets/edit-budget/budget-edit-section";
import { summarizeSection } from "@/components/budgets/edit-budget/budget-edit-summaries";
import { slugifyBudgetName } from "@/lib/budget-slug";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Editar en el panel lateral con las secciones del editor de presupuestos (la
// 38): se abren de a una o varias y, cerradas, muestran su resumen. Cada
// sección marca si cambió respecto de lo que armó el agente.
export function AgentBudgetEditSections({
  open,
  onToggle,
  original,
}: {
  open: CreatorStepId[];
  onToggle: (step: CreatorStepId) => void;
  original: BudgetFormValues;
}) {
  const { control } = useFormContext<BudgetFormValues>();
  const values = useWatch({ control }) as BudgetFormValues;
  const slug = slugifyBudgetName(String(values.name ?? "")) || "…";

  return (
    <div className="flex flex-col gap-3">
      {CREATOR_STEPS.map((step) => (
        <BudgetEditSection
          changed={step.fields.some((field) => JSON.stringify(values[field] ?? null) !== JSON.stringify(original[field] ?? null))}
          key={step.id}
          onToggle={() => onToggle(step.id)}
          open={open.includes(step.id)}
          summary={summarizeSection(step.id, values, slug)}
          title={step.label}
        >
          <CreatorStepFields step={step.id} />
        </BudgetEditSection>
      ))}
    </div>
  );
}
