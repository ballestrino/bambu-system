import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ReceiptText } from "lucide-react";

import { formatDetailDate } from "@/components/budgets/budget-details/budget-detail-model";

type BudgetDetailHeaderProps = {
  budget: {
    name: string;
    description: string | null;
    updatedAt: Date | string;
    budgetCategory: { id: string; name: string }[];
    officialBudget: { id: string; currentVersion: number } | null;
  };
  actions: ReactNode;
  children: ReactNode;
};

const StatusBadge = ({ official }: { official: BudgetDetailHeaderProps["budget"]["officialBudget"] }) =>
  official ? (
    <Link
      className="inline-flex h-[26px] items-center gap-[5px] rounded-full border border-ops-bamboo/35 bg-ops-bamboo-soft px-2.5 text-xs font-semibold text-ops-bamboo-strong hover:bg-ops-bamboo-soft/70"
      href={`/dashboard/official-budgets/${official.id}`}
    >
      <BadgeCheck className="size-[13px]" />
      Oficial v{official.currentVersion}
    </Link>
  ) : (
    <span className="inline-flex h-[26px] items-center rounded-full border border-ops-border px-2.5 text-xs font-semibold text-ops-text-muted">
      Borrador
    </span>
  );

// Cabecera del presupuesto: volver, nombre con su estado, descripción, fecha,
// categorías y las acciones; abajo van los números principales (children).
export const BudgetDetailHeader = ({ budget, actions, children }: BudgetDetailHeaderProps) => (
  <section className="flex flex-col gap-5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
        <Link
          className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-[10px] px-2.5 text-[13.5px] font-semibold text-ops-bamboo-strong hover:text-ops-bamboo"
          href="/dashboard/budgets"
        >
          <ArrowLeft className="size-4" />
          Presupuestos
        </Link>
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 flex-none place-items-center rounded-[10px] bg-ops-bamboo-soft text-ops-bamboo-strong">
            <ReceiptText className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">{budget.name}</h1>
              <StatusBadge official={budget.officialBudget} />
            </div>
            <p className="text-[14.5px] text-ops-text-muted">
              {budget.description ? `${budget.description} · ` : null}
              actualizado el {formatDetailDate(budget.updatedAt)}
            </p>
            {budget.budgetCategory.length ? (
              <div className="flex flex-wrap gap-1.5">
                {budget.budgetCategory.map((category) => (
                  <span
                    className="inline-flex h-[26px] items-center rounded-full bg-ops-surface-muted px-2.5 text-[12.5px] font-medium text-ops-text"
                    key={category.id}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {actions}
    </div>
    {children}
  </section>
);
