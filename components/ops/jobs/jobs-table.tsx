"use client";

import { ArrowDown, ArrowUp, BriefcaseBusiness, ChevronsUpDown } from "lucide-react";

import { JobsCheckbox } from "@/components/ops/jobs/jobs-checkbox";
import type { JobsSortKey } from "@/components/ops/jobs/jobs-table-model";
import { JobsTableRow, type JobRowHandlers } from "@/components/ops/jobs/jobs-table-row";
import { jobsGridClass } from "@/components/ops/jobs/jobs-styles";
import type { JobsTableState } from "@/components/ops/jobs/use-jobs-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const monthShort = new Intl.DateTimeFormat("es-UY", { month: "short" });

const SortHead = ({
  align = "left",
  label,
  sortKey,
  table,
}: {
  align?: "left" | "right";
  label: string;
  sortKey: JobsSortKey;
  table: JobsTableState;
}) => {
  const isActive = table.sort.key === sortKey;
  const Icon = !isActive ? ChevronsUpDown : table.sort.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <span
      aria-sort={isActive ? (table.sort.direction === "asc" ? "ascending" : "descending") : undefined}
      className={cn("flex", align === "right" && "justify-end pr-[18px]")}
      role="columnheader"
    >
      <button
        className="inline-flex items-center gap-1 rounded select-none hover:text-ops-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ops-bamboo/40"
        onClick={() => table.toggleSort(sortKey)}
        type="button"
      >
        {label}
        <Icon aria-hidden className={cn("size-[13px]", !isActive && "opacity-60")} />
      </button>
    </span>
  );
};

const EmptyState = ({ onClear }: { onClear: () => void }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-[72px] text-center">
    <span className="flex size-12 items-center justify-center rounded-[14px] bg-ops-bamboo-soft text-ops-bamboo-strong">
      <BriefcaseBusiness className="size-[22px]" />
    </span>
    <div className="flex flex-col gap-1">
      <span className="text-base font-semibold text-ops-text">Todavía no hay trabajos en este filtro</span>
      <span className="text-[13.5px] text-ops-text-muted">
        Crea un trabajo nuevo o limpia los filtros para volver a ver la operación completa.
      </span>
    </div>
    <button
      className="h-10 rounded-[10px] border border-ops-border px-4 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted"
      onClick={onClear}
      type="button"
    >
      Limpiar filtros
    </button>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
    <span className="text-base font-semibold text-ops-text">No pudimos cargar los trabajos</span>
    <span className="text-[13.5px] text-ops-text-muted">{message}</span>
    <button
      className="h-10 rounded-[10px] border border-ops-border px-4 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted"
      onClick={onRetry}
      type="button"
    >
      Reintentar
    </button>
  </div>
);

export const JobsTable = ({ handlers, table }: { handlers: JobRowHandlers; table: JobsTableState }) => {
  const { selection, visibleRows } = table;
  const someSelected = selection.rows.length > 0;

  return (
    <div aria-label="Trabajos" role="table">
      <div
        className={cn(
          jobsGridClass,
          "h-10 items-center border-b border-ops-border bg-ops-surface-muted/60 pr-2 text-xs font-semibold text-ops-text-muted"
        )}
        role="row"
      >
        <span className="flex justify-center" role="columnheader">
          <JobsCheckbox
            checked={selection.allSelected ? true : someSelected ? "indeterminate" : false}
            label="Seleccionar todos los trabajos visibles"
            onCheckedChange={selection.toggleAll}
          />
        </span>
        <SortHead label="Trabajo" sortKey="name" table={table} />
        <span className="hidden @5xl/jobs:block" role="columnheader">Tipo</span>
        <span className="hidden @5xl/jobs:block" role="columnheader">Presupuesto</span>
        <span className="hidden @3xl/jobs:block">
          <SortHead align="right" label="Opción" sortKey="price" table={table} />
        </span>
        <span className="hidden capitalize @3xl/jobs:block" role="columnheader">
          Rentabilidad · {monthShort.format(table.month).replace(".", "")}
        </span>
        <span className="hidden @3xl/jobs:block" role="columnheader">Estado</span>
        <span role="columnheader"><span className="sr-only">Acciones</span></span>
      </div>

      {table.isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          <span className="sr-only">Cargando…</span>
          {Array.from({ length: 6 }, (_, index) => <Skeleton className="h-12 w-full" key={index} />)}
        </div>
      ) : table.error && !visibleRows.length ? (
        <ErrorState
          message={table.error instanceof Error ? table.error.message : "Probá de nuevo en unos segundos."}
          onRetry={() => void table.refetch()}
        />
      ) : visibleRows.length ? (
        <div className="pb-[84px]" role="rowgroup">
          {visibleRows.map((row) => (
            <JobsTableRow
              handlers={handlers}
              isSelected={selection.isSelected(row.job.id)}
              key={row.job.id}
              onToggle={() => selection.toggle(row.job.id)}
              row={row}
            />
          ))}
        </div>
      ) : (
        <EmptyState onClear={table.clearFilters} />
      )}
    </div>
  );
};
