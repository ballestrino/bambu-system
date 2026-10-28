"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import type { JobsTableState, JobVisibility } from "@/components/ops/jobs/use-jobs-table";
import { OpsSearchInput } from "@/components/ops/shared";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const visibilityOptions: [JobVisibility, string][] = [
  ["DEFAULT", "Actuales"],
  ["PUNCTUAL", "Puntuales"],
  ["ALL", "Todos"],
];

// Barra de la tabla (1a): pestañas de estado con conteo, "Requiere atención",
// buscador, vista, archivados y refrescar.
export const JobsTableBar = ({ table }: { table: JobsTableState }) => {
  const { attentionCount, filters, tabs, updateFilters } = table;

  return (
    <>
      <div className="flex flex-none items-center gap-0.5 overflow-x-auto border-b border-ops-border px-2.5">
        <div className="flex" role="tablist" aria-label="Estado de los trabajos">
          {tabs.map((tab) => {
            const isActive = filters.status === tab.key;
            return (
              <button
                aria-selected={isActive}
                className={cn(
                  "inline-flex h-[46px] items-center gap-[7px] px-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  isActive
                    ? "text-ops-text shadow-[inset_0_-2px_0_var(--ops-bamboo-strong)]"
                    : "text-ops-text-muted hover:text-ops-text"
                )}
                key={tab.key}
                onClick={() => updateFilters({ status: tab.key })}
                role="tab"
                type="button"
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11.5px] tabular-nums",
                    isActive
                      ? "bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                      : "bg-ops-surface-muted text-ops-text-muted"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <span className="flex-1" />
        <button
          aria-pressed={filters.attentionOnly}
          className={cn(
            "my-2 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-[11px] text-[12.5px] font-semibold whitespace-nowrap transition-colors",
            filters.attentionOnly
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
              : "border-ops-border bg-ops-surface text-ops-text-muted hover:bg-ops-surface-muted"
          )}
          onClick={() => updateFilters({ attentionOnly: !filters.attentionOnly })}
          type="button"
        >
          <TriangleAlert className="size-3.5" />
          Requiere atención
          <span className="tabular-nums">{attentionCount}</span>
        </button>
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2.5 border-b border-ops-border px-3.5 py-2.5">
        <OpsSearchInput
          className="h-[38px] w-full basis-full rounded-[10px] @3xl/jobs:max-w-[400px] @3xl/jobs:basis-auto"
          isSearching={table.isSearching}
          onChange={(query) => updateFilters({ query })}
          onSubmit={table.flushQuery}
          placeholder="Buscar por nombre, descripción o ubicación"
          value={filters.query}
        />
        <div className="flex rounded-[10px] bg-ops-surface-muted p-[3px]" role="group" aria-label="Vista">
          {visibilityOptions.map(([value, label]) => (
            <button
              aria-pressed={filters.visibility === value}
              className={cn(
                "inline-flex h-8 items-center rounded-[7px] px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
                filters.visibility === value
                  ? "bg-ops-surface text-ops-text shadow-[0_1px_2px_rgba(24,37,29,0.12)]"
                  : "text-ops-text-muted hover:text-ops-text"
              )}
              key={value}
              onClick={() => updateFilters({ visibility: value })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <label className="inline-flex h-[38px] cursor-pointer items-center gap-2.5 rounded-[10px] border border-ops-border px-3 text-[13px] font-medium whitespace-nowrap text-ops-text select-none">
          Incluir archivados
          <Switch
            checked={filters.includeArchived}
            className="data-[state=checked]:bg-ops-bamboo-strong"
            onCheckedChange={(includeArchived) =>
              updateFilters({
                includeArchived,
                status: !includeArchived && filters.status === "ARCHIVED" ? "all" : filters.status,
              })
            }
          />
        </label>
        <span className="flex-1" />
        <button
          aria-label="Refrescar"
          className="flex size-[38px] items-center justify-center rounded-[10px] border border-ops-border text-ops-text hover:bg-ops-surface-muted disabled:opacity-60"
          disabled={table.isFetching}
          onClick={() => void table.refetch()}
          title="Refrescar"
          type="button"
        >
          <RefreshCw className={cn("size-4", table.isFetching && "animate-spin")} />
        </button>
      </div>
    </>
  );
};
