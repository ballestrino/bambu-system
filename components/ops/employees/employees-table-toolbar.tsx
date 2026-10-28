"use client";

import { RefreshCw } from "lucide-react";

import {
  employeeStateOptions,
  type EmployeeStateFilter,
} from "@/components/ops/employees/employees-table-model";
import { OpsSearchInput, opsSwitchClass } from "@/components/ops/shared";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Barra de la tabla de empleados (1a): búsqueda, estado con conteos, archivados
// y refrescar.
export const EmployeesTableToolbar = ({
  counts,
  includeArchived,
  isFetching,
  query,
  state,
  onIncludeArchivedChange,
  onQueryChange,
  onQuerySubmit,
  onRefresh,
  onStateChange,
}: {
  counts: Record<EmployeeStateFilter, number>;
  includeArchived: boolean;
  isFetching: boolean;
  query: string;
  state: EmployeeStateFilter;
  onIncludeArchivedChange: (value: boolean) => void;
  onQueryChange: (value: string) => void;
  onQuerySubmit: () => void;
  onRefresh: () => void;
  onStateChange: (value: EmployeeStateFilter) => void;
}) => (
  <div className="flex flex-none items-center gap-2.5 border-b border-ops-border px-3.5 py-3">
    <OpsSearchInput
      className="h-[38px] max-w-[380px] rounded-[10px]"
      isSearching={isFetching}
      placeholder="Buscar por nombre, email, teléfono o notas"
      value={query}
      onChange={onQueryChange}
      onSubmit={onQuerySubmit}
    />
    <div aria-label="Estado" className="flex rounded-[10px] bg-ops-surface-muted p-[3px]" role="radiogroup">
      {employeeStateOptions.map(({ label, value }) => {
        const active = value === state;

        return (
          <button
            aria-checked={active}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
              active
                ? "bg-ops-surface text-ops-text shadow-[0_1px_2px_rgb(24_37_29/0.12)]"
                : "text-ops-text/75 hover:text-ops-text"
            )}
            key={value}
            onClick={() => onStateChange(value)}
            role="radio"
            type="button"
          >
            {label}
            <span className="text-[11.5px] font-semibold text-ops-text-muted tabular-nums">
              {counts[value]}
            </span>
          </button>
        );
      })}
    </div>
    <label className="inline-flex h-[38px] cursor-pointer items-center gap-2.5 rounded-[10px] border border-ops-border px-3 text-[13px] font-medium whitespace-nowrap text-ops-text select-none">
      Incluir archivados
      <Switch
        checked={includeArchived}
        className={opsSwitchClass}
        onCheckedChange={onIncludeArchivedChange}
      />
    </label>
    <span className="flex-1" />
    <button
      aria-label="Refrescar"
      className="flex size-[38px] flex-none items-center justify-center rounded-[10px] border border-ops-border text-ops-text hover:bg-ops-surface-muted disabled:opacity-60"
      disabled={isFetching}
      onClick={onRefresh}
      type="button"
    >
      <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
    </button>
  </div>
);
