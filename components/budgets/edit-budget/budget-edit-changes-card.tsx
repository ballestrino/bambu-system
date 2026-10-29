"use client";

import { useWatch, useFormContext } from "react-hook-form";

import { buildBudgetSummary, formatBudgetMoney, formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import type { BudgetEditChange } from "@/components/budgets/edit-budget/budget-edit-changes";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type BudgetEditChangesCardProps = {
  changes: BudgetEditChange[];
  onUndo: (change: BudgetEditChange) => void;
  savedValues: Partial<BudgetFormValues>;
};

// Lo que cambia antes de guardar: el precio contra el guardado y cada cambio
// con su Deshacer.
export const BudgetEditChangesCard = ({ changes, onUndo, savedValues }: BudgetEditChangesCardProps) => {
  const { control } = useFormContext<BudgetFormValues>();
  const values = useWatch({ control });
  if (!changes.length) return null;

  const saved = buildBudgetSummary(savedValues, false).price;
  const current = buildBudgetSummary(values, false).price;
  const diff = current - saved;
  const percent = saved > 0 ? (diff / saved) * 100 : 0;

  return (
    <section className="flex flex-col gap-3 rounded-[var(--ops-radius-panel)] border border-amber-300 bg-ops-surface p-4 dark:border-amber-500/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-ops-text">
          {changes.length === 1 ? "1 cambio sin guardar" : `${changes.length} cambios sin guardar`}
        </h2>
        {Math.round(diff) !== 0 ? (
          <span className={cn("text-[13px] font-semibold tabular-nums", diff > 0 ? "text-ops-bamboo-strong" : "text-red-700 dark:text-red-300")}>
            {diff > 0 ? "+" : "−"} {formatBudgetMoney(Math.abs(diff))} ({diff > 0 ? "+" : "−"}{formatBudgetNumber(Math.abs(percent), 1)}%)
          </span>
        ) : null}
      </div>
      <p className="text-[13px] text-ops-text-muted">
        Sin productos, sin IVA: guardado <span className="tabular-nums line-through">{formatBudgetMoney(saved)}</span>, ahora{" "}
        <strong className="font-semibold tabular-nums text-ops-text">{formatBudgetMoney(current)}</strong>
      </p>
      <ul className="flex flex-col gap-1.5">
        {changes.map((change) => (
          <li className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-ops-canvas pl-3 dark:bg-ops-surface-muted" key={change.field}>
            <span className="size-[7px] shrink-0 rounded-full bg-ops-amber" />
            <span className="min-w-0 flex-1 text-[13.5px] text-ops-text">
              <strong className="font-semibold">{change.label}</strong>{" "}
              <span className="text-ops-text-muted">{change.from} → {change.to}</span>
            </span>
            <button
              className="h-11 shrink-0 rounded-[10px] px-3 text-[13px] font-semibold text-ops-bamboo-strong hover:bg-ops-bamboo-soft"
              onClick={() => onUndo(change)}
              type="button"
            >
              Deshacer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
