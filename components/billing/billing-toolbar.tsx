"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { BillingFilterPanel } from "@/components/billing/billing-filter-panel";
import type { BillingList } from "@/components/billing/hooks/use-billing-list";
import { OpsSearchInput } from "@/components/ops/shared/ops-search-input";
import { VisitSheet } from "@/components/ops/visits/visit-sheet";
import { cn } from "@/lib/utils";

const sheetOutline = "h-[52px] flex-1 rounded-[14px] border border-ops-border text-base font-semibold text-ops-text";
const sheetPrimary = "h-[52px] flex-[1.7] rounded-[14px] bg-ops-bamboo-strong text-base font-semibold text-white dark:text-ops-canvas";

// Búsqueda por cliente o RUT y filtros (48): tipo, estado ante DGI y marcadas.
// En escritorio, "Filtros" abre y cierra un panel; en el teléfono, un botón
// redondo abre una hoja inferior, como los filtros de Visitas.
export const BillingToolbar = ({ list }: { list: BillingList }) => {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { activeCount, clearFilters, counts, filters, setFilters, view } = list;
  const panelCount = activeCount - (filters.query.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <OpsSearchInput
          aria-label="Buscar por cliente o RUT"
          className="min-w-0 flex-1 md:w-[280px] md:flex-none"
          onChange={(query) => setFilters({ ...filters, query })}
          placeholder="Buscar cliente o RUT"
          value={filters.query}
        />
        <button
          aria-label={panelCount ? `Filtros, ${panelCount} puestos` : "Filtros"}
          className="relative flex size-11 flex-none items-center justify-center rounded-full border border-ops-border bg-ops-surface md:hidden"
          onClick={() => setSheetOpen(true)}
          type="button"
        >
          <SlidersHorizontal aria-hidden className="size-[19px]" />
          {panelCount ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-ops-bamboo-strong text-[10.5px] font-bold text-white ring-2 ring-ops-canvas dark:text-ops-canvas">
              {panelCount}
            </span>
          ) : null}
        </button>
        <button
          aria-controls="billing-filters"
          aria-expanded={open}
          className={cn(
            "hidden h-10 shrink-0 items-center gap-1.5 rounded-[var(--ops-radius-control)] border px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none md:inline-flex",
            panelCount
              ? "border-ops-bamboo bg-ops-bamboo-soft text-ops-bamboo-strong"
              : "border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted"
          )}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filtros
          {panelCount ? <span className="tabular-nums">· {panelCount}</span> : null}
          <ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {activeCount ? (
          <button
            className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text md:inline-flex"
            onClick={clearFilters}
            type="button"
          >
            <X aria-hidden className="size-3.5" />
            Limpiar filtros
          </button>
        ) : null}
      </div>
      {open ? (
        <div
          className="hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-4 md:block"
          id="billing-filters"
        >
          <BillingFilterPanel filters={filters} onChange={setFilters} view={view} />
        </div>
      ) : null}
      <VisitSheet
        footer={
          <div className="flex gap-2">
            <button className={sheetOutline} onClick={clearFilters} type="button">
              Limpiar
            </button>
            <button className={sheetPrimary} onClick={() => setSheetOpen(false)} type="button">
              Ver {counts[view]} {counts[view] === 1 ? "factura" : "facturas"}
            </button>
          </div>
        }
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        title="Filtrar facturas"
      >
        <div className="px-5 pb-4">
          <BillingFilterPanel filters={filters} onChange={setFilters} size="lg" view={view} />
        </div>
      </VisitSheet>
    </div>
  );
};
