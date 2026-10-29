"use client";

import Link from "next/link";

import { buildBudgetRow } from "@/components/budgets/list/budget-list-model";
import { BudgetRowActions, BudgetStatusBadge } from "@/components/budgets/list/budget-row-actions";
import type { GeneratorBudgetListItem } from "@/components/budgets/interfaces/generator-budget";

// Celular: una tarjeta por presupuesto con los números grandes y los botones
// del pulgar abajo.
export const BudgetsCards = ({ budgets }: { budgets: GeneratorBudgetListItem[] }) => (
  <ul className="flex flex-col">
    {budgets.map((budget) => {
      const row = buildBudgetRow(budget);

      return (
        <li className="flex flex-col gap-3 border-t border-ops-border px-4 py-4 first:border-t-0" key={row.id}>
          <div className="flex items-start justify-between gap-3">
            <Link className="min-w-0" href={`/dashboard/budgets/budget/${row.slug}`}>
              <span className="block text-[15px] font-semibold text-ops-text">{row.name}</span>
              <span className="mt-0.5 block text-[13px] text-ops-text-muted">{row.service} · {row.people}</span>
            </Link>
            <BudgetStatusBadge budget={budget} />
          </div>
          <Link className="grid grid-cols-3 gap-2 rounded-xl bg-ops-canvas p-3 dark:bg-ops-surface-muted" href={`/dashboard/budgets/budget/${row.slug}`}>
            <span className="flex flex-col gap-0.5">
              <span className="text-[11.5px] text-ops-text-muted">Sin IVA</span>
              <span className="text-[15px] font-semibold tabular-nums text-ops-text">{row.price}</span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[11.5px] text-ops-text-muted">Por hora</span>
              <span className="text-[15px] font-semibold tabular-nums text-ops-text">{row.hourly}</span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[11.5px] text-ops-text-muted">Ganancia</span>
              <span className="text-[15px] font-semibold tabular-nums text-ops-bamboo-strong">{row.margin}</span>
            </span>
          </Link>
          {row.productsPrice || row.categories.length ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ops-text-muted">
              {row.categories.map((category) => (
                <span className="inline-flex h-[22px] items-center rounded-full bg-ops-surface-muted px-2 font-medium text-ops-text" key={category.id}>
                  {category.name}
                </span>
              ))}
              {row.productsPrice ? <span>Con productos {row.productsPrice}</span> : null}
            </div>
          ) : null}
          <BudgetRowActions budget={budget} labeled />
        </li>
      );
    })}
  </ul>
);
