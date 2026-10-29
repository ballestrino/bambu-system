"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Sparkles, TrendingUp } from "lucide-react";

import { AgentSheetHost } from "@/components/agent/agent-sheet-host";
import { buildBudgetSummary, formatBudgetDecimal, formatBudgetMoney, formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import { BudgetSummaryRows } from "@/components/budgets/create-budget/budget-summary-rows";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type BudgetMobileSheetProps = {
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
};

// Hoja fija del celular: precio y ganancia siempre a la vista, el desglose al
// expandirla. El asistente flota arriba de la hoja, sin taparla.
export const BudgetMobileSheet = ({ isPending, onOpenChange, onSave, open }: BudgetMobileSheetProps) => {
  const form = useFormContext<BudgetFormValues>();
  const values = useWatch({ control: form.control });
  const summary = buildBudgetSummary(values, false);
  const withProducts = summary.hasProducts ? buildBudgetSummary(values, true) : null;

  return (
    <>
      {open ? (
        <button
          aria-label="Cerrar el detalle"
          className="fixed inset-0 z-20 bg-black/35"
          onClick={() => onOpenChange(false)}
          type="button"
        />
      ) : null}
      <div className="fixed inset-x-0 bottom-[var(--bottom-tabs-space)] z-30 rounded-t-[20px] border-t border-ops-border bg-ops-surface px-4 pt-2 pb-4 shadow-[0_-12px_32px_rgb(24_37_29/0.16)]">
        <div className="absolute -top-[72px] right-4">
          <AgentSheetHost
            getFormValues={() => form.getValues()}
            trigger={
              <button
                aria-label="Abrir asistente"
                className="grid size-14 place-items-center rounded-[18px] border border-ops-border bg-ops-surface text-ops-bamboo-strong shadow-[0_10px_24px_rgb(24_37_29/0.22)]"
                type="button"
              >
                <Sparkles className="size-6" />
              </button>
            }
          />
        </div>
        <button
          aria-expanded={open}
          className="flex w-full flex-col items-stretch gap-2 text-left"
          onClick={() => onOpenChange(!open)}
          type="button"
        >
          <span className="mx-auto h-1 w-10 rounded-full bg-ops-border" />
          <span className="flex items-end justify-between gap-3">
            <span className="flex flex-col gap-0.5">
              <span className="text-[12.5px] text-ops-text-muted">Precio mensual sin IVA</span>
              <span className="text-[26px] leading-[1.1] font-semibold tracking-tight tabular-nums text-ops-text">{formatBudgetMoney(summary.price)}</span>
            </span>
            <span className="flex flex-col items-end gap-0.5">
              <span className="text-[15px] font-semibold tabular-nums text-ops-text">$ {formatBudgetDecimal(summary.hourly)} /h</span>
              <span className="text-[13px] font-semibold text-ops-bamboo-strong">{open ? "Ocultar detalle" : "Ver detalle"}</span>
            </span>
          </span>
        </button>
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-ops-bamboo-soft px-3 py-2.5 text-ops-bamboo-strong">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="size-4" />
            Ganancia {formatBudgetNumber(summary.revenuePct)}%
          </span>
          <span className="text-[15px] font-bold tabular-nums">+ {formatBudgetMoney(summary.gain)}</span>
        </div>
        {open ? (
          <div className="mt-1 max-h-[42dvh] overflow-y-auto">
            <BudgetSummaryRows rows={summary.rows} />
            {withProducts ? (
              <p className="flex justify-between gap-3 border-t border-ops-border py-2 text-[13.5px] text-ops-text-muted">
                Con productos, sin IVA
                <span className="font-semibold tabular-nums text-ops-text">{formatBudgetMoney(withProducts.price)}</span>
              </p>
            ) : null}
          </div>
        ) : null}
        <button
          className="mt-3 h-[52px] w-full rounded-[14px] bg-ops-bamboo-strong text-base font-semibold text-white disabled:opacity-60 dark:text-ops-canvas"
          disabled={isPending}
          onClick={onSave}
          type="button"
        >
          {isPending ? "Guardando..." : "Guardar presupuesto"}
        </button>
      </div>
    </>
  );
};
