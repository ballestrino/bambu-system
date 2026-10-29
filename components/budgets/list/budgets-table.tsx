"use client";

import Link from "next/link";

import { buildBudgetRow } from "@/components/budgets/list/budget-list-model";
import { BudgetRowActions, BudgetStatusBadge } from "@/components/budgets/list/budget-row-actions";
import type { GeneratorBudgetListItem } from "@/components/budgets/interfaces/generator-budget";

const headClass = "px-3 py-2.5 text-xs font-semibold text-ops-text-muted";

// Escritorio y tablet: una fila por presupuesto con las acciones a la vista.
export const BudgetsTable = ({ budgets }: { budgets: GeneratorBudgetListItem[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[980px] border-collapse text-sm">
      <thead>
        <tr className="text-left">
          <th className={`${headClass} pl-4`} scope="col">Presupuesto</th>
          <th className={headClass} scope="col">Servicio</th>
          <th className={`${headClass} text-right`} scope="col">Precio sin IVA</th>
          <th className={`${headClass} text-right`} scope="col">Precio hora</th>
          <th className={`${headClass} text-right`} scope="col">Ganancia</th>
          <th className={headClass} scope="col">Estado</th>
          <th className={headClass} scope="col">Actualizado</th>
          <th className={`${headClass} pr-4 text-right`} scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {budgets.map((budget) => {
          const row = buildBudgetRow(budget);

          return (
            <tr className="border-t border-ops-border align-top hover:bg-ops-canvas/60 dark:hover:bg-ops-surface-muted/50" key={row.id}>
              <td className="max-w-[320px] py-3 pr-3 pl-4">
                <Link className="font-semibold text-ops-text hover:text-ops-bamboo-strong" href={`/dashboard/budgets/budget/${row.slug}`}>
                  {row.name}
                </Link>
                {row.description ? <p className="mt-0.5 truncate text-[12.5px] text-ops-text-muted">{row.description}</p> : null}
                {row.categories.length ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {row.categories.map((category) => (
                      <span className="inline-flex h-[22px] items-center rounded-full bg-ops-surface-muted px-2 text-[11.5px] font-medium text-ops-text" key={category.id}>
                        {category.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-3 text-[13.5px] whitespace-nowrap text-ops-text-muted">
                {row.service}
                <span className="mt-0.5 block text-[12.5px]">{row.people}</span>
              </td>
              <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                <span className="font-semibold text-ops-text">{row.price}</span>
                {row.productsPrice ? <span className="mt-0.5 block text-[12.5px] text-ops-text-muted">con productos {row.productsPrice}</span> : null}
              </td>
              <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-ops-text">{row.hourly}</td>
              <td className="px-3 py-3 text-right">
                <span className="inline-flex h-6 items-center rounded-full bg-ops-bamboo-soft px-2 text-[12.5px] font-semibold tabular-nums text-ops-bamboo-strong">
                  {row.margin}
                </span>
              </td>
              <td className="px-3 py-3"><BudgetStatusBadge budget={budget} /></td>
              <td className="px-3 py-3 text-[13.5px] whitespace-nowrap text-ops-text-muted">{row.updated}</td>
              <td className="py-1.5 pr-3 pl-1"><BudgetRowActions budget={budget} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
