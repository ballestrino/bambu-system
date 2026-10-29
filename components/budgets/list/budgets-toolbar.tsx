"use client";

import { useEffect, useRef, useState } from "react";

import { BudgetsFiltersMenu } from "@/components/budgets/filters/BudgetsFiltersMenu";
import type { BudgetStatusCounts } from "@/components/budgets/interfaces/generator-budget";
import { OpsSearchInput } from "@/components/ops/shared/ops-search-input";
import { useOpsFlushableDebouncedValue } from "@/components/ops/shared/use-ops-debounced-value";
import { cn } from "@/lib/utils";

type BudgetsToolbarProps = {
  counts?: BudgetStatusCounts;
  isFetching: boolean;
  params: URLSearchParams;
  updateParams: (change: (next: URLSearchParams) => void) => void;
};

const TABS = [
  { label: "Todos", value: "all" },
  { label: "Borradores", value: "draft" },
  { label: "Oficiales", value: "official" },
] as const;

export const BudgetsToolbar = ({ counts, isFetching, params, updateParams }: BudgetsToolbarProps) => {
  const status = params.get("status") ?? "all";
  const urlQuery = params.get("query") ?? "";
  const [search, setSearch] = useState(urlQuery);
  const [previousUrlQuery, setPreviousUrlQuery] = useState(urlQuery);
  // Limpiar filtros cambia la URL: el buscador la sigue.
  if (urlQuery !== previousUrlQuery) {
    setPreviousUrlQuery(urlQuery);
    setSearch(urlQuery);
  }
  const [debouncedSearch, flushSearch] = useOpsFlushableDebouncedValue(search, 500);
  const latest = useRef({ updateParams, urlQuery });
  useEffect(() => {
    latest.current = { updateParams, urlQuery };
  });

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term === latest.current.urlQuery) return;
    latest.current.updateParams((next) => (term ? next.set("query", term) : next.delete("query")));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div aria-label="Estado" className="flex w-full rounded-[11px] bg-ops-surface-muted p-[3px] md:w-auto" role="tablist">
        {TABS.map((tab) => {
          const active = tab.value === status;

          return (
            <button
              aria-selected={active}
              className={cn(
                "inline-flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold transition-colors md:flex-none md:px-3",
                active ? "bg-ops-surface text-ops-bamboo-strong shadow-[0_1px_3px_rgb(24_37_29/0.14)]" : "text-ops-text/75 hover:text-ops-text"
              )}
              key={tab.value}
              onClick={() => updateParams((next) => (tab.value === "all" ? next.delete("status") : next.set("status", tab.value)))}
              role="tab"
              type="button"
            >
              {tab.label}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-[11.5px] leading-5 tabular-nums",
                  active ? "bg-ops-bamboo-soft" : "bg-ops-surface"
                )}
              >
                {counts ? counts[tab.value] : "–"}
              </span>
            </button>
          );
        })}
      </div>
      <OpsSearchInput
        aria-label="Buscar presupuestos"
        className="min-w-[200px] flex-1"
        isSearching={isFetching && search.trim() !== ""}
        onChange={setSearch}
        onSubmit={flushSearch}
        placeholder="Buscar por nombre o descripción"
        value={search}
      />
      <BudgetsFiltersMenu />
    </div>
  );
};
