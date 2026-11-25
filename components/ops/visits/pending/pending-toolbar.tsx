"use client";

import { ChevronDown, Search } from "lucide-react";

import { PENDING_AGE_LABELS, PENDING_AGES, type PendingSummary } from "@/lib/ops/pending-visits";
import type { PendingFilters } from "@/lib/ops/pending-visit-groups";
import { opsFilterControlClass } from "@/components/ops/shared";
import { cn } from "@/lib/utils";

const segment = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold whitespace-nowrap transition-colors";

// Antiguedad (con las cuentas de todas), busqueda por trabajo y equipo.
export const PendingToolbar = ({
  employees,
  filters,
  onChange,
  summary,
}: {
  employees: { id: string; name: string }[];
  filters: PendingFilters;
  onChange: (changes: Partial<PendingFilters>) => void;
  summary: PendingSummary;
}) => {
  const options = [
    { count: summary.total, label: "Todas", value: "all" as const },
    ...PENDING_AGES.map((age) => ({ count: summary.ages[age], label: PENDING_AGE_LABELS[age], value: age })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--ops-radius-row)] bg-ops-surface-muted p-2.5">
      <div aria-label="Antigüedad" className="flex max-w-full gap-0.5 overflow-x-auto rounded-[10px] border border-ops-border bg-ops-surface p-[3px]" role="radiogroup">
        {options.map((option) => {
          const active = filters.age === option.value;
          return (
            <button
              aria-checked={active}
              className={cn(segment, active ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas" : "text-ops-text hover:bg-ops-surface-muted")}
              key={option.value}
              onClick={() => onChange({ age: option.value })}
              role="radio"
              type="button"
            >
              {option.label}
              <span className={cn("font-medium tabular-nums", active ? "opacity-80" : "text-ops-text-muted")}>{option.count}</span>
            </button>
          );
        })}
      </div>
      <label className="relative flex min-w-[180px] flex-[1_1_200px] items-center">
        <span className="sr-only">Buscar trabajo</span>
        <Search className="pointer-events-none absolute left-3 size-4 text-ops-text-muted" />
        <input
          className={cn(opsFilterControlClass, "border pl-9 text-[13.5px]")}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Buscar trabajo"
          type="search"
          value={filters.search}
        />
      </label>
      <label className="relative flex min-w-[170px] flex-[0_1_220px]">
        <span className="sr-only">Equipo</span>
        <select
          className={cn(opsFilterControlClass, "appearance-none border pr-9 text-[13.5px]")}
          onChange={(event) => onChange({ team: event.target.value })}
          value={filters.team}
        >
          <option value="all">Todo el equipo</option>
          <option value="none">Sin equipo</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>{employee.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ops-text-muted" />
      </label>
    </div>
  );
};
