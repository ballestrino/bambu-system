"use client";

import Link from "next/link";

import { OfficialStatusBadge } from "@/components/budgets/budget-details/budget-detail-header";
import { buildOfficialRow } from "@/components/official-budgets/list/official-list-model";
import { OfficialRowActions } from "@/components/official-budgets/list/official-row-actions";
import type { OfficialBudgetRowDto } from "@/components/official-budgets/types";

const headClass = "px-3 py-2.5 text-xs font-semibold text-ops-text-muted";

export const UnlinkedMark = () => (
  <span className="inline-flex h-[22px] items-center rounded-full bg-amber-50 px-2 text-[11.5px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
    Generador desvinculado
  </span>
);

// Escritorio y tablet: una fila por oficial con los precios de su versión vigente.
export const OfficialBudgetsTable = ({ budgets }: { budgets: OfficialBudgetRowDto[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[920px] border-collapse text-sm">
      <thead>
        <tr className="text-left">
          <th className={`${headClass} pl-4`} scope="col">Presupuesto</th>
          <th className={headClass} scope="col">Servicio</th>
          <th className={`${headClass} text-right`} scope="col">Precio sin IVA</th>
          <th className={`${headClass} text-right`} scope="col">Precio hora</th>
          <th className={headClass} scope="col">Versión</th>
          <th className={headClass} scope="col">Estado</th>
          <th className={`${headClass} pr-4 text-right`} scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {budgets.map((budget) => {
          const row = buildOfficialRow(budget);

          return (
            <tr className="border-t border-ops-border align-top hover:bg-ops-canvas/60 dark:hover:bg-ops-surface-muted/50" key={row.id}>
              <td className="max-w-[340px] py-3 pr-3 pl-4">
                <Link className="font-semibold text-ops-text hover:text-ops-bamboo-strong" href={row.href}>
                  {row.name}
                </Link>
                {row.linked ? null : <div className="mt-1.5"><UnlinkedMark /></div>}
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
              <td className="px-3 py-3 text-[13.5px] whitespace-nowrap text-ops-text">
                {row.version}
                <span className="mt-0.5 block text-[12.5px] text-ops-text-muted">{row.versionDate}</span>
              </td>
              <td className="px-3 py-3"><OfficialStatusBadge active={row.active} /></td>
              <td className="py-1.5 pr-3 pl-1"><OfficialRowActions budget={budget} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
