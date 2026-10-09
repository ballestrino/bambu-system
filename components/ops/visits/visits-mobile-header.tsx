"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { formatDayLabel } from "@/lib/ops/visit-calendar";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { countActiveFilters } from "@/components/ops/visits/visits-header";
import { VisitsViewToggle } from "@/components/ops/visits/visits-view-toggle";

// Encabezado del celular (2a): titulo con el dia (abre el mes), Agenda o
// Cronograma y el boton redondo de filtros con su contador.
export const VisitsMobileHeader = ({
  ctrl,
  onOpenFilters,
  onOpenMonth,
}: {
  ctrl: VisitsController;
  onOpenFilters: () => void;
  onOpenMonth: () => void;
}) => {
  const active = countActiveFilters(ctrl);

  return (
    <div className="flex items-center gap-2 pr-1 pl-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-ops-text">Visitas</h1>
        <button
          className="inline-flex items-center gap-0.5 self-start text-sm font-medium whitespace-nowrap text-ops-bamboo-strong"
          onClick={onOpenMonth}
          type="button"
        >
          {formatDayLabel(ctrl.desk.dayKey)}
          <ChevronDown className="size-[15px]" />
        </button>
      </div>
      <VisitsViewToggle compact onChange={ctrl.desk.setView} value={ctrl.desk.view} />
      <button
        aria-label="Filtros"
        className="relative flex size-11 items-center justify-center rounded-full border border-ops-border bg-ops-surface"
        onClick={onOpenFilters}
        type="button"
      >
        <SlidersHorizontal className="size-[19px]" />
        {active ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-ops-bamboo-strong text-[10.5px] font-bold text-white ring-2 ring-ops-canvas dark:text-ops-canvas">
            {active}
          </span>
        ) : null}
      </button>
    </div>
  );
};
