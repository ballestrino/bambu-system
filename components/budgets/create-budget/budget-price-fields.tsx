"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Info } from "lucide-react";

import { BudgetCommitInput } from "@/components/budgets/create-budget/budget-commit-input";
import {
  formatBudgetDecimal,
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";
import { CreatorAffixInput, CreatorSegmented } from "@/components/budgets/create-budget/creator-ui";
import { useBudgetHourlyPricing } from "@/components/budgets/hooks/useBudgetHourlyPricing";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type PriceMode = "margin" | "service" | "hourly";

const MODES: { label: string; value: PriceMode }[] = [
  { label: "Ganancia", value: "margin" },
  { label: "Precio total", value: "service" },
  { label: "Precio hora", value: "hourly" },
];

export const BudgetPriceFields = () => {
  const form = useFormContext<BudgetFormValues>();
  const pricing = useBudgetHourlyPricing(form);
  const [mode, setMode] = useState<PriceMode>("margin");
  const revenue = Number(useWatch({ control: form.control, name: "revenue_percent" })) || 0;
  const cards = [
    { commit: pricing.setRevenuePercent, display: formatBudgetNumber(revenue), label: "Ganancia del servicio", prefix: "", suffix: "%", value: revenue, mode: "margin" as const },
    { commit: pricing.setTargetServicePrice, display: formatBudgetDecimal(pricing.targetServicePrice), label: "Precio objetivo", prefix: "$", suffix: "por mes", value: pricing.targetServicePrice, mode: "service" as const },
    { commit: pricing.setTargetHourlyPrice, display: formatBudgetDecimal(pricing.targetHourlyPrice), label: "Precio hora objetivo", prefix: "$", suffix: "por hora", value: pricing.targetHourlyPrice, mode: "hourly" as const },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <CreatorSegmented label="Definir el precio por" onChange={setMode} options={MODES} value={mode} />
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const active = card.mode === mode;
          const inputId = `budget-price-${card.mode}`;

          return (
            <div
              className={cn(
                "flex min-w-0 flex-col gap-2 rounded-xl p-3",
                active ? "border-2 border-ops-bamboo bg-ops-bamboo-soft" : "border border-ops-border bg-ops-canvas p-[13px] dark:bg-ops-surface-muted"
              )}
              key={card.mode}
            >
              <div className="flex items-center justify-between gap-2">
                {active ? (
                  <label className="text-[13px] font-semibold text-ops-text" htmlFor={inputId}>{card.label}</label>
                ) : (
                  <span className="text-[13px] font-semibold text-ops-text">{card.label}</span>
                )}
                <span className={cn("text-[11.5px] font-semibold", active ? "text-ops-bamboo-strong" : "text-ops-text-muted")}>
                  {active ? "Lo fijás vos" : "Calculado"}
                </span>
              </div>
              {active ? (
                <BudgetCommitInput
                  disabled={card.mode !== "margin" && !pricing.canCalculate}
                  id={inputId}
                  onCommit={card.commit}
                  prefix={card.prefix || undefined}
                  suffix={card.suffix}
                  value={card.value}
                />
              ) : (
                <p className="flex h-11 items-center gap-1.5 text-base font-semibold tabular-nums text-ops-text">
                  {card.prefix ? <span className="font-normal text-ops-text-muted">{card.prefix}</span> : null}
                  {card.display}
                  <span className="text-[13px] font-normal text-ops-text-muted">{card.suffix}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2.5">
          <label className="text-[13px] font-semibold text-ops-text" htmlFor="budget-iva">IVA</label>
          <CreatorAffixInput
            id="budget-iva"
            inputMode="decimal"
            min={0}
            suffix="%"
            type="number"
            wrapperClassName="w-24"
            {...form.register("iva", { valueAsNumber: true })}
          />
        </div>
        <p className={cn("inline-flex items-center gap-2 text-[13px]", pricing.wasClamped ? "text-amber-800 dark:text-amber-200" : "text-ops-text-muted")}>
          <Info className="size-4 shrink-0" />
          {pricing.wasClamped ? "Ajustado al piso sin ganancia: " : "Piso sin ganancia: "}
          <strong className="font-semibold tabular-nums text-ops-text">{formatBudgetMoney(pricing.minimumServicePrice)}</strong>
          · $ {formatBudgetDecimal(pricing.minimumHourlyPrice)} por hora
        </p>
      </div>
    </div>
  );
};
