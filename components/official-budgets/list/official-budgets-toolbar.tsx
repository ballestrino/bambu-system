"use client";

import { useEffect, useRef, useState } from "react";

import { OpsSearchInput } from "@/components/ops/shared/ops-search-input";
import { useOpsFlushableDebouncedValue } from "@/components/ops/shared/use-ops-debounced-value";
import type { OfficialBudgetStatus } from "@/components/official-budgets/types";
import { cn } from "@/lib/utils";

type OfficialBudgetsToolbarProps = {
  counts?: Record<OfficialBudgetStatus, number>;
  isFetching: boolean;
  query: string;
  status: OfficialBudgetStatus;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: OfficialBudgetStatus) => void;
};

const TABS: { label: string; value: OfficialBudgetStatus }[] = [
  { label: "Activos", value: "ACTIVE" },
  { label: "Archivados", value: "ARCHIVED" },
];

// Pestañas con su conteo bajo la misma búsqueda y el buscador con demora.
export const OfficialBudgetsToolbar = ({ counts, isFetching, query, status, onQueryChange, onStatusChange }: OfficialBudgetsToolbarProps) => {
  const [search, setSearch] = useState(query);
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setSearch(query);
  }
  const [debouncedSearch, flushSearch] = useOpsFlushableDebouncedValue(search, 500);
  const latest = useRef({ onQueryChange, query });
  useEffect(() => {
    latest.current = { onQueryChange, query };
  });

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term !== latest.current.query) latest.current.onQueryChange(term);
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
              onClick={() => onStatusChange(tab.value)}
              role="tab"
              type="button"
            >
              {tab.label}
              <span className={cn("min-w-5 rounded-full px-1.5 text-[11.5px] leading-5 tabular-nums", active ? "bg-ops-bamboo-soft" : "bg-ops-surface")}>
                {counts ? counts[tab.value] : "–"}
              </span>
            </button>
          );
        })}
      </div>
      <OpsSearchInput
        aria-label="Buscar presupuestos oficiales"
        className="min-w-[200px] flex-1"
        isSearching={isFetching && search.trim() !== ""}
        onChange={setSearch}
        onSubmit={flushSearch}
        placeholder="Buscar por nombre"
        value={search}
      />
    </div>
  );
};
