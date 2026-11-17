"use client";

import Link from "next/link";

import { OfficialStatusBadge } from "@/components/budgets/budget-details/budget-detail-header";
import { buildOfficialRow } from "@/components/official-budgets/list/official-list-model";
import { UnlinkedMark } from "@/components/official-budgets/list/official-budgets-table";
import { OfficialRowActions } from "@/components/official-budgets/list/official-row-actions";
import type { OfficialBudgetRowDto } from "@/components/official-budgets/types";

// Celular: una tarjeta por oficial con los precios grandes y los botones abajo.
export const OfficialBudgetsCards = ({ budgets }: { budgets: OfficialBudgetRowDto[] }) => (
  <ul className="flex flex-col">
    {budgets.map((budget) => {
      const row = buildOfficialRow(budget);

      return (
        <li className="flex flex-col gap-3 border-t border-ops-border px-4 py-4 first:border-t-0" key={row.id}>
          <div className="flex items-start justify-between gap-3">
            <Link className="min-w-0" href={row.href}>
              <span className="block text-[15px] font-semibold text-ops-text">{row.name}</span>
              <span className="mt-0.5 block text-[13px] text-ops-text-muted">{row.service} · {row.people}</span>
            </Link>
            <OfficialStatusBadge active={row.active} />
          </div>
          <Link className="grid grid-cols-3 gap-2 rounded-xl bg-ops-canvas p-3 dark:bg-ops-surface-muted" href={row.href}>
            <span className="flex flex-col gap-0.5">
              <span className="text-[11.5px] text-ops-text-muted">Sin IVA</span>
              <span className="text-[15px] font-semibold tabular-nums text-ops-text">{row.price}</span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[11.5px] text-ops-text-muted">Por hora</span>
              <span className="text-[15px] font-semibold tabular-nums text-ops-text">{row.hourly}</span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[11.5px] text-ops-text-muted">Publicada</span>
              <span className="text-[13.5px] font-semibold text-ops-text">{row.versionDate}</span>
            </span>
          </Link>
          {row.productsPrice || !row.linked ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ops-text-muted">
              {row.linked ? null : <UnlinkedMark />}
              {row.productsPrice ? <span>Con productos {row.productsPrice}</span> : null}
            </div>
          ) : null}
          <OfficialRowActions budget={budget} labeled />
        </li>
      );
    })}
  </ul>
);
