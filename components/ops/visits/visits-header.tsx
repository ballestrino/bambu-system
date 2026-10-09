"use client";

import { useState } from "react";
import { Plus, RefreshCw, SlidersHorizontal } from "lucide-react";

import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitFilterFields } from "@/components/ops/visits/visit-filter-fields";
import { VisitsViewToggle } from "@/components/ops/visits/visits-view-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const countActiveFilters = (ctrl: VisitsController) => {
  const { filters } = ctrl.desk;
  return [filters.jobId !== "ALL", filters.employeeId !== "ALL", filters.status !== "ALL", filters.attentionOnly].filter(Boolean).length;
};

export const FilterBadge = ({ count, className }: { className?: string; count: number }) =>
  count ? (
    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ops-bamboo-strong px-1.5 text-[11px] font-semibold text-white dark:text-ops-canvas", className)}>
      {count}
    </span>
  ) : null;

const outlineButton =
  "inline-flex h-10 items-center gap-[7px] rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-ops-text hover:bg-ops-surface-muted";

// Encabezado de escritorio (3a): titulo, selector de vistas, filtros,
// refrescar y nueva visita.
export const VisitsHeader = ({ ctrl, countLabel }: { countLabel: string; ctrl: VisitsController }) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, desk } = ctrl;
  const active = countActiveFilters(ctrl);

  return (
    <div className="flex flex-none flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-ops-bamboo-strong">Operaciones</span>
        <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Visitas</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <VisitsViewToggle onChange={desk.setView} value={desk.view} />
        {desk.view === "cron" ? null : (
          <Popover onOpenChange={setFiltersOpen} open={filtersOpen}>
            <PopoverTrigger asChild>
              <button className={cn(outlineButton, filtersOpen && "border-ops-bamboo bg-ops-bamboo-soft")} type="button">
                <SlidersHorizontal className="size-4" />
                Filtros
                <FilterBadge count={active} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-[380px] flex-col gap-3.5 rounded-[var(--ops-radius-panel)] border-ops-border p-4 shadow-[var(--ops-shadow-elevated)]">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-ops-text">Filtrar visitas</span>
                <span className="text-[13px] text-ops-text-muted">{countLabel}</span>
              </div>
              <VisitFilterFields
                employeeOptions={data.employeeOptions}
                filters={desk.filters}
                jobOptions={data.jobOptions}
                onChange={desk.updateFilters}
              />
              <div className="flex justify-end gap-2 border-t border-ops-surface-muted pt-3">
                <button className="h-9 rounded-[9px] px-3 text-[13px] font-semibold text-ops-text-muted hover:bg-ops-surface-muted disabled:opacity-50" disabled={!active} onClick={desk.clearFilters} type="button">
                  Limpiar
                </button>
                <button className="h-9 rounded-[9px] bg-ops-bamboo-strong px-3.5 text-[13px] font-semibold text-white dark:text-ops-canvas" onClick={() => setFiltersOpen(false)} type="button">
                  Listo
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <button
          aria-label="Refrescar"
          className="flex size-10 items-center justify-center rounded-[10px] border border-ops-border bg-ops-surface hover:bg-ops-surface-muted disabled:opacity-60"
          disabled={data.isFetching}
          onClick={() => void data.refetch()}
          type="button"
        >
          <RefreshCw className={cn("size-4", data.isFetching && "animate-spin")} />
        </button>
        <button
          className="inline-flex h-10 items-center gap-[7px] rounded-[10px] bg-ops-bamboo-strong px-4 text-[13.5px] font-semibold whitespace-nowrap text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas"
          onClick={() => ctrl.newVisit()}
          type="button"
        >
          <Plus className="size-4" />
          Nueva visita
        </button>
      </div>
    </div>
  );
};
