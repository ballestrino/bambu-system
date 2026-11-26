"use client";

import { OpsSearchInput } from "@/components/ops/shared/ops-search-input";
import type { BoardFilter } from "@/components/ops/schedule-rules/schedule-rules-model";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { cn } from "@/lib/utils";

const filters: { label: string; value: BoardFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Sin horario", value: "none" },
  { label: "Con avisos", value: "warn" },
];

// Filtros Todos / Sin horario / Con avisos y la búsqueda. En el celular los
// filtros se deslizan de costado.
export const RulesToolbar = ({ compact = false, ctrl }: { compact?: boolean; ctrl: ScheduleRulesController }) => (
  <div className={cn("flex gap-3", compact ? "flex-col" : "flex-wrap items-center justify-between")}>
    <div
      aria-label="Filtrar servicios"
      className={cn("flex gap-2", compact ? "-mx-4 overflow-x-auto px-4 py-0.5 [scrollbar-width:none]" : "flex-wrap")}
      role="group"
    >
      {filters.map((filter) => {
        const active = ctrl.filter === filter.value;
        return (
          <button
            aria-pressed={active}
            className={cn(
              "inline-flex min-h-10 flex-none items-center gap-2 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
              active
                ? "border-ops-bamboo-strong bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                : "border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted"
            )}
            key={filter.value}
            onClick={() => ctrl.setFilter(filter.value)}
            type="button"
          >
            {filter.label}
            <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-white/20" : "bg-ops-surface-muted text-ops-text-muted")}>
              {ctrl.counts[filter.value]}
            </span>
          </button>
        );
      })}
    </div>
    <OpsSearchInput
      aria-label="Buscar servicio"
      className={compact ? "w-full flex-none" : "w-full max-w-80"}
      onChange={ctrl.setQuery}
      placeholder="Buscar servicio o dirección"
      value={ctrl.query}
    />
  </div>
);
