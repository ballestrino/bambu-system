"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { buildBudgetSummary, formatBudgetDecimal, formatBudgetMoney, formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import { BudgetSummaryRows } from "@/components/budgets/create-budget/budget-summary-rows";
import { CreatorSegmented } from "@/components/budgets/create-budget/creator-ui";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type SummaryView = "base" | "products";

const VIEWS: { label: string; value: SummaryView }[] = [
  { label: "Sin productos", value: "base" },
  { label: "Con productos", value: "products" },
];

// Resumen en vivo del escritorio: precio, precio hora, composición y desglose.
export const BudgetSummaryPanel = () => {
  const { control } = useFormContext<BudgetFormValues>();
  const values = useWatch({ control });
  const [view, setView] = useState<SummaryView>("base");
  const hasProducts = Number(values.products_price) > 0;
  const summary = buildBudgetSummary(values, hasProducts && view === "products");
  const people = Math.max(1, Number(values.employees) || 1);

  return (
    <section className="flex flex-col gap-[18px] rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ops-text">Resumen</h2>
        <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-ops-bamboo-soft px-2.5 text-xs font-semibold text-ops-bamboo-strong">
          <span className="size-[7px] rounded-full bg-ops-bamboo" />
          En vivo
        </span>
      </div>
      {hasProducts ? <CreatorSegmented className="w-full" label="Opción" onChange={setView} options={VIEWS} value={view} /> : null}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-ops-text-muted">Precio mensual sin IVA</span>
        <span className="text-[40px] leading-[1.1] font-semibold tracking-tight tabular-nums text-ops-text">{formatBudgetMoney(summary.price)}</span>
        <span className="text-[13.5px] tabular-nums text-ops-text-muted">
          {formatBudgetMoney(summary.priceWithIva)} con IVA {formatBudgetNumber(summary.ivaPct)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ops-surface-muted p-3">
          <p className="text-xs font-medium text-ops-text-muted">Precio hora</p>
          <p className="mt-1 text-[19px] font-semibold tabular-nums text-ops-text">$ {formatBudgetDecimal(summary.hourly)}</p>
          <p className="mt-0.5 text-xs text-ops-text-muted">sin IVA</p>
        </div>
        <div className="rounded-xl bg-ops-surface-muted p-3">
          <p className="text-xs font-medium text-ops-text-muted">Horas al mes</p>
          <p className="mt-1 text-[19px] font-semibold tabular-nums text-ops-text">{formatBudgetNumber(summary.totalHours, 1)} hs</p>
          <p className="mt-0.5 text-xs text-ops-text-muted">{people} {people === 1 ? "persona" : "personas"}</p>
        </div>
      </div>
      {summary.segments.length ? (
        <div className="flex flex-col gap-2.5">
          <div
            aria-label={`Composición del precio: ${summary.segments.map((segment) => `${segment.label} ${segment.pct}`).join(", ")}`}
            className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
            role="img"
          >
            {summary.segments.map((segment) => (
              <span className={segment.colorClass} key={segment.key} style={{ flex: `${segment.amount} 1 0` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
            {summary.segments.map((segment) => (
              <span className="inline-flex items-center gap-1.5 text-xs text-ops-text-muted" key={segment.key}>
                <span className={`size-2 rounded-[2px] ${segment.colorClass}`} />
                {segment.label} <span className="tabular-nums">{segment.pct}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <BudgetSummaryRows className="border-t border-ops-border" rows={summary.rows} />
      <p className="text-xs leading-relaxed text-ops-text-muted">
        Precio de un mes de servicio. Las visitas semanales se cuentan a 4,32 semanas por mes.
      </p>
    </section>
  );
};
