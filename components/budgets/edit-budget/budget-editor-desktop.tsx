"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, Save, Sparkles } from "lucide-react";

import { AgentSheetHost } from "@/components/agent/agent-sheet-host";
import { BudgetSummaryPanel } from "@/components/budgets/create-budget/budget-summary-panel";
import { CreatorStepFields } from "@/components/budgets/create-budget/creator-step-fields";
import { CREATOR_STEPS, type CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import { creatorOutlineButtonClass, creatorPrimaryButtonClass } from "@/components/budgets/create-budget/creator-ui";
import { BudgetEditChangesCard } from "@/components/budgets/edit-budget/budget-edit-changes-card";
import { BudgetEditSection } from "@/components/budgets/edit-budget/budget-edit-section";
import { summarizeSection } from "@/components/budgets/edit-budget/budget-edit-summaries";
import { BudgetOfficialNotice } from "@/components/budgets/edit-budget/budget-official-notice";
import { BudgetSlugField } from "@/components/budgets/edit-budget/budget-slug-field";
import type { BudgetEditorState } from "@/components/budgets/edit-budget/hooks/use-budget-editor";
import type { ExistingBudget } from "@/components/budgets/interfaces/edit-buget";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type BudgetEditorDesktopProps = {
  budget: ExistingBudget;
  editor: BudgetEditorState;
  onSave: () => void;
};

// Escritorio: secciones que se abren de a una o varias, con un resumen de una
// línea cerradas, y a la derecha los cambios sin guardar y el resumen en vivo.
export const BudgetEditorDesktop = ({ budget, editor, onSave }: BudgetEditorDesktopProps) => {
  const form = useFormContext<BudgetFormValues>();
  const values = useWatch({ control: form.control });
  const [open, setOpen] = useState<CreatorStepId[]>(["equipo", "precio"]);
  const changedSections = new Set(editor.changes.map((change) => change.section));
  const hasChanges = editor.changes.length > 0;
  const toggle = (step: CreatorStepId) =>
    setOpen((current) => (current.includes(step) ? current.filter((item) => item !== step) : [...current, step]));

  return (
    <div className="container flex w-full flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ops-border pb-[18px]">
        <div className="flex min-w-0 flex-col gap-1">
          <Link className="inline-flex min-h-8 w-fit items-center gap-1.5 text-[13px] font-semibold text-ops-bamboo-strong" href={`/dashboard/budgets/budget/${budget.slug}`}>
            <ArrowLeft className="size-[15px]" />
            Volver al presupuesto
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">{budget.name}</h1>
            {hasChanges ? (
              <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                <span className="size-[7px] rounded-full bg-ops-amber" />
                {editor.changes.length === 1 ? "1 cambio sin guardar" : `${editor.changes.length} cambios sin guardar`}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-ops-text-muted">Editando · los cambios se ven en el resumen antes de guardar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={creatorOutlineButtonClass} disabled={!hasChanges || editor.isPending} onClick={editor.discard} type="button">
            Descartar
          </button>
          <AgentSheetHost
            getFormValues={() => form.getValues()}
            trigger={
              <button className={creatorOutlineButtonClass} type="button">
                <Sparkles className="size-4" />
                Asistente
              </button>
            }
          />
          <button className={creatorPrimaryButtonClass} disabled={!hasChanges || editor.isPending} onClick={onSave} type="button">
            <Save className="size-4" />
            {editor.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </header>
      {budget.officialBudget ? <BudgetOfficialNotice currentVersion={budget.officialBudget.currentVersion} /> : null}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
          {CREATOR_STEPS.map((step) => (
            <BudgetEditSection
              changed={changedSections.has(step.id)}
              key={step.id}
              onToggle={() => toggle(step.id)}
              open={open.includes(step.id)}
              summary={summarizeSection(step.id, values, editor.slug)}
              title={step.label}
            >
              <CreatorStepFields
                detailSlot={<BudgetSlugField onChange={editor.setSlug} value={editor.slug} />}
                step={step.id}
              />
            </BudgetEditSection>
          ))}
        </div>
        <aside className="sticky top-5 flex min-w-0 flex-[1_1_360px] flex-col gap-3">
          <BudgetEditChangesCard changes={editor.changes} onUndo={editor.undo} savedValues={editor.savedValues} />
          <BudgetSummaryPanel />
        </aside>
      </div>
    </div>
  );
};
