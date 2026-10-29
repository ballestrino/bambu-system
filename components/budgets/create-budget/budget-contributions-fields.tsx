"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { CreatorAffixInput, CreatorSwitch } from "@/components/budgets/create-budget/creator-ui";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

const ROWS = [
  {
    amount: "personalVal",
    enabled: "personal_enabled",
    hint: "Incluidos en la hora nominal. Apagados, se descuenta 18,1% de la hora.",
    label: "Aportes personales",
    percent: "personal_contribution",
  },
  {
    amount: "companyVal",
    enabled: "company_enabled",
    hint: "Se suman al costo.",
    label: "Aportes patronales",
    percent: "company_contribution",
  },
  {
    amount: "incidenceVal",
    enabled: "incidence_enabled",
    hint: "Se suman al costo.",
    label: "Aguinaldo y salario vacacional",
    percent: "incidence_contribution",
  },
] as const;

export const BudgetContributionsFields = () => {
  const { control, register } = useFormContext<BudgetFormValues>();
  const totals = calculateBudgetTotals(useWatch({ control }));

  return (
    <div className="flex flex-col rounded-xl bg-ops-canvas dark:bg-ops-surface-muted">
      {ROWS.map((row, index) => (
        <div className={cn("flex flex-wrap items-center gap-3 px-3.5 py-3", index > 0 && "border-t border-ops-border")} key={row.enabled}>
          <Controller
            control={control}
            name={row.enabled}
            render={({ field }) => (
              <CreatorSwitch aria-label={row.label} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
            )}
          />
          <div className="min-w-[180px] flex-1">
            <p className="text-sm font-semibold text-ops-text">{row.label}</p>
            <p className="text-[12.5px] text-ops-text-muted">{row.hint}</p>
          </div>
          <CreatorAffixInput
            aria-label={`Porcentaje de ${row.label.toLowerCase()}`}
            inputMode="decimal"
            min={0}
            step="0.001"
            suffix="%"
            type="number"
            wrapperClassName="w-[110px]"
            {...register(row.percent, { valueAsNumber: true })}
          />
          <span className="w-[84px] text-right text-sm font-semibold tabular-nums text-ops-text">
            {formatBudgetMoney(totals[row.amount])}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 border-t border-ops-border px-3.5 py-3">
        <span className="text-[13.5px] font-semibold text-ops-text">Costo extra por cargas</span>
        <span className="text-sm font-bold tabular-nums text-ops-text">{formatBudgetMoney(totals.totalContribsExtra)}</span>
      </div>
    </div>
  );
};
