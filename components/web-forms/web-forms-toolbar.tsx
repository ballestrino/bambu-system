"use client";

import { OpsSearchInput } from "@/components/ops/shared/ops-search-input";
import { cn } from "@/lib/utils";

export type WebFormStatusFilter = "NEW" | "REPLIED" | "ARCHIVED" | "ALL";
export type WebFormKindTab = "CONTACT" | "JOB_APPLICATION";
export type WebFormFilters = { status: WebFormStatusFilter; kind: WebFormKindTab; search: string };

type Counts = Record<WebFormStatusFilter, number>;

// Los tres estados de la pestaña (Pedidos de servicio o Currículums) que se
// mira; los números cuentan lo que coincide con la búsqueda en cada uno.
const STATUS_CHIPS: { id: WebFormStatusFilter; label: string }[] = [
  { id: "NEW", label: "Nuevos" },
  { id: "REPLIED", label: "Respondidos" },
  { id: "ARCHIVED", label: "Archivados" },
];

export function WebFormsToolbar({
  filters,
  counts,
  isSearching,
  onChange,
}: {
  filters: WebFormFilters;
  counts: Counts | undefined;
  isSearching: boolean;
  onChange: (filters: WebFormFilters) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Estado de los formularios">
        {STATUS_CHIPS.map((chip) => {
          const active = filters.status === chip.id;
          const count = counts?.[chip.id];
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...filters, status: chip.id })}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors sm:h-9",
                active
                  ? "border-ops-bamboo-strong bg-ops-bamboo-soft font-medium text-ops-bamboo-strong"
                  : "border-ops-border text-ops-text-muted hover:bg-ops-surface-muted"
              )}
            >
              {chip.label}
              {count === undefined ? null : <span className="text-xs tabular-nums opacity-80">{count}</span>}
            </button>
          );
        })}
      </div>

      <OpsSearchInput
        placeholder="Buscar por nombre, correo, teléfono o mensaje"
        value={filters.search}
        isSearching={isSearching}
        onChange={(search) => onChange({ ...filters, search })}
      />
    </div>
  );
}
