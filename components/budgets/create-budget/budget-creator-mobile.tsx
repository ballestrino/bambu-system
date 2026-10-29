"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";

import { BudgetMobileSheet } from "@/components/budgets/create-budget/budget-mobile-sheet";
import { CreatorStepFields } from "@/components/budgets/create-budget/creator-step-fields";
import { CREATOR_STEPS, type CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import { cn } from "@/lib/utils";

type BudgetCreatorMobileProps = {
  isPending: boolean;
  onSave: () => void;
  onStepChange: (step: CreatorStepId) => void;
  step: CreatorStepId;
};

// Celular (opción A): un paso por pantalla con barra de progreso y lista de
// pasos. Siguiente marca el paso como listo; en el último abre el resumen.
export const BudgetCreatorMobile = ({ isPending, onSave, onStepChange, step }: BudgetCreatorMobileProps) => {
  const [done, setDone] = useState<CreatorStepId[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const index = CREATOR_STEPS.findIndex((item) => item.id === step);
  const current = CREATOR_STEPS[index];
  const previous = CREATOR_STEPS[index - 1];
  const following = CREATOR_STEPS[index + 1];

  const goTo = (next: CreatorStepId) => {
    onStepChange(next);
    setListOpen(false);
    window.scrollTo({ top: 0 });
  };
  const finishStep = () => {
    setDone((items) => (items.includes(step) ? items : [...items, step]));
    if (following) goTo(following.id);
    else setSheetOpen(true);
  };

  return (
    <div className="flex w-full flex-col gap-3 pb-[260px]">
      <header className="flex items-center gap-1">
        <Link aria-label="Volver a presupuestos" className="-ml-2 grid size-11 place-items-center rounded-xl text-ops-text" href="/dashboard/budgets">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-semibold text-ops-bamboo-strong">
            Nuevo presupuesto · paso {index + 1} de {CREATOR_STEPS.length}
          </span>
          <h1 className="text-[21px] leading-tight font-semibold tracking-tight text-ops-text">{current.label}</h1>
        </div>
        <button
          aria-expanded={listOpen}
          className="inline-flex h-11 items-center gap-1 rounded-xl border border-ops-border bg-ops-surface px-3 text-sm font-semibold text-ops-text"
          onClick={() => setListOpen((open) => !open)}
          type="button"
        >
          Pasos
          <ChevronDown className={cn("size-4 transition-transform", listOpen && "rotate-180")} />
        </button>
      </header>
      <div aria-hidden className="flex gap-1">
        {CREATOR_STEPS.map((item, position) => (
          <span
            className={cn(
              "h-1.5 flex-1 rounded-full",
              position === index ? "bg-ops-bamboo" : done.includes(item.id) ? "bg-ops-bamboo-strong" : "bg-ops-border"
            )}
            key={item.id}
          />
        ))}
      </div>
      {listOpen ? (
        <nav aria-label="Pasos" className="overflow-hidden rounded-2xl border border-ops-border bg-ops-surface">
          {CREATOR_STEPS.map((item, position) => {
            const active = position === index;
            const finished = done.includes(item.id);

            return (
              <button
                className={cn(
                  "flex min-h-[52px] w-full items-center gap-3 px-3.5 text-left",
                  position > 0 && "border-t border-ops-border",
                  active && "bg-ops-bamboo-soft"
                )}
                key={item.id}
                onClick={() => goTo(item.id)}
                type="button"
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold",
                    active || finished ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas" : "bg-ops-surface-muted text-ops-text-muted"
                  )}
                >
                  {finished && !active ? <Check className="size-3.5" /> : position + 1}
                </span>
                <span className="flex-1 text-[15px] font-semibold text-ops-text">{item.label}</span>
                <span className="text-[13px] text-ops-text-muted">{active ? "Acá estás" : finished ? "Listo" : "Falta"}</span>
              </button>
            );
          })}
        </nav>
      ) : null}
      <section className="rounded-2xl border border-ops-border bg-ops-surface p-4">
        <p className="mb-4 text-[13.5px] text-ops-text-muted">{current.description}</p>
        <CreatorStepFields step={step} />
      </section>
      <div className="flex gap-2">
        {previous ? (
          <button
            className="h-12 flex-1 rounded-xl border border-ops-border bg-ops-surface text-[15px] font-semibold text-ops-text"
            onClick={() => goTo(previous.id)}
            type="button"
          >
            Anterior
          </button>
        ) : null}
        <button
          className="h-12 flex-[2] rounded-xl border border-ops-bamboo bg-ops-bamboo-soft text-[15px] font-semibold text-ops-bamboo-strong"
          onClick={finishStep}
          type="button"
        >
          {following ? `Siguiente: ${following.label}` : "Listo, ver el resumen"}
        </button>
      </div>
      <BudgetMobileSheet isPending={isPending} onOpenChange={setSheetOpen} onSave={onSave} open={sheetOpen} />
    </div>
  );
};
