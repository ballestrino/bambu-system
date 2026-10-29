"use client";

import Link from "next/link";
import { useFormContext } from "react-hook-form";
import { Save, Sparkles } from "lucide-react";

import { AgentSheetHost } from "@/components/agent/agent-sheet-host";
import { BudgetSummaryPanel } from "@/components/budgets/create-budget/budget-summary-panel";
import { CreatorStepFields } from "@/components/budgets/create-budget/creator-step-fields";
import { CREATOR_STEPS } from "@/components/budgets/create-budget/creator-steps";
import {
  creatorOutlineButtonClass,
  creatorPrimaryButtonClass,
} from "@/components/budgets/create-budget/creator-ui";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type BudgetCreatorDesktopProps = {
  isPending: boolean;
  onSave: () => void;
};

// Escritorio: las cinco secciones a la izquierda y el resumen fijo a la derecha.
export const BudgetCreatorDesktop = ({ isPending, onSave }: BudgetCreatorDesktopProps) => {
  const form = useFormContext<BudgetFormValues>();

  return (
    <div className="container flex w-full flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ops-border pb-[18px]">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-ops-bamboo-strong">Presupuestos</span>
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Nuevo presupuesto</h1>
          <p className="text-sm text-ops-text-muted">Cargá el servicio y el precio se recalcula mientras escribís.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={creatorOutlineButtonClass} href="/dashboard/budgets">
            Cancelar
          </Link>
          <AgentSheetHost
            getFormValues={() => form.getValues()}
            trigger={
              <button className={creatorOutlineButtonClass} type="button">
                <Sparkles className="size-4" />
                Asistente
              </button>
            }
          />
          <button className={creatorPrimaryButtonClass} disabled={isPending} onClick={onSave} type="button">
            <Save className="size-4" />
            {isPending ? "Guardando..." : "Guardar presupuesto"}
          </button>
        </div>
      </header>
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {CREATOR_STEPS.map((step, index) => (
            <section
              className="flex flex-col gap-[18px] rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5"
              key={step.id}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ops-bamboo-soft text-[13px] font-bold text-ops-bamboo-strong">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <h2 className="text-[17px] font-semibold text-ops-text">{step.label}</h2>
                  <p className="text-[13.5px] text-ops-text-muted">{step.description}</p>
                </div>
              </div>
              <CreatorStepFields step={step.id} />
            </section>
          ))}
        </div>
        <aside className="sticky top-5 flex min-w-0 flex-[1_1_360px] flex-col gap-3">
          <BudgetSummaryPanel />
        </aside>
      </div>
    </div>
  );
};
