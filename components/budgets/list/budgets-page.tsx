"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Tag } from "lucide-react";

import useBudgets from "@/components/budgets/hooks/useBudgets";
import { BudgetsCards } from "@/components/budgets/list/budgets-cards";
import { BudgetsEmpty, BudgetsError, BudgetsLoading } from "@/components/budgets/list/budgets-list-states";
import { BudgetsQuickChips } from "@/components/budgets/list/budgets-quick-chips";
import { BudgetsTable } from "@/components/budgets/list/budgets-table";
import { BudgetsToolbar } from "@/components/budgets/list/budgets-toolbar";
import { useBudgetListParams } from "@/components/budgets/list/use-budget-list-params";
import { cn } from "@/lib/utils";

const outlineButton =
  "inline-flex h-11 items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

export const BudgetsPage = () => {
  const { clearFilters, filters, hasFilters, page, params, setPage, updateParams } = useBudgetListParams();
  const { budgets, isError, isFetching, isLoading, refetch, statusCounts, totalCount, totalPages } = useBudgets(filters);
  const first = totalCount ? (page - 1) * filters.limit + 1 : 0;
  const last = Math.min(page * filters.limit, totalCount);

  return (
    <div className="container flex w-full flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-ops-bamboo-strong">Precios</span>
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Presupuestos</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={outlineButton} href="/dashboard/budgets/categories">
            <Tag className="size-4" />
            Categorías
          </Link>
          <button aria-label="Refrescar" className={`${outlineButton} w-11 px-0`} disabled={isFetching} onClick={() => void refetch()} type="button">
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </button>
          <Link
            className="inline-flex h-11 items-center gap-[7px] rounded-[10px] bg-ops-bamboo-strong px-[18px] text-[13.5px] font-semibold text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas"
            href="/dashboard/budgets/create"
          >
            <Plus className="size-4" />
            Nuevo presupuesto
          </Link>
        </div>
      </header>

      <section className="flex flex-col rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
        <div className="flex flex-col gap-3 border-b border-ops-border p-3.5 md:p-4">
          <BudgetsToolbar counts={statusCounts} isFetching={isFetching} params={params} updateParams={updateParams} />
          <BudgetsQuickChips hasFilters={hasFilters} onClear={clearFilters} params={params} updateParams={updateParams} />
        </div>

        {isLoading ? (
          <BudgetsLoading />
        ) : isError && !budgets.length ? (
          <BudgetsError onRetry={() => void refetch()} />
        ) : !budgets.length ? (
          <BudgetsEmpty hasFilters={hasFilters || Boolean(filters.status)} onClear={clearFilters} />
        ) : (
          <>
            <div className="hidden md:block">
              <BudgetsTable budgets={budgets} />
            </div>
            <div className="md:hidden">
              <BudgetsCards budgets={budgets} />
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ops-border px-4 py-3 text-[13px] text-ops-text-muted">
          <span>{totalCount ? `${first}–${last} de ${totalCount} presupuestos` : "Sin presupuestos"}</span>
          <div className="flex items-center gap-1.5">
            <button aria-label="Página anterior" className={`${outlineButton} h-10 w-10 px-0`} disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-16 text-center tabular-nums">{totalPages ? `${page} de ${totalPages}` : "–"}</span>
            <button aria-label="Página siguiente" className={`${outlineButton} h-10 w-10 px-0`} disabled={page >= totalPages} onClick={() => setPage(page + 1)} type="button">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
