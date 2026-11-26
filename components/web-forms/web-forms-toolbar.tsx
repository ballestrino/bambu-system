"use client";

import { OpsSearchInput } from "@/components/ops/shared/ops-search-input";
import { OpsViewTabs } from "@/components/ops/shared/ops-view-tabs";
import { WEB_FORM_KIND_LABELS } from "@/lib/web-forms/labels";
import { cn } from "@/lib/utils";

export type WebFormStatusFilter = "NEW" | "REPLIED" | "ARCHIVED" | "ALL";
export type WebFormKindFilter = "ALL" | "CONTACT" | "JOB_APPLICATION";
export type WebFormFilters = { status: WebFormStatusFilter; kind: WebFormKindFilter; search: string };

type Counts = Record<WebFormStatusFilter, number>;

// Sin "Todos": en la columna de la lista no entra, y los tres estados cubren
// todo (los números cuentan lo que coincide con la búsqueda en cada uno).
const STATUS_TABS: { id: WebFormStatusFilter; label: string }[] = [
  { id: "NEW", label: "Nuevos" },
  { id: "REPLIED", label: "Respondidos" },
  { id: "ARCHIVED", label: "Archivados" },
];

const KIND_CHIPS: { id: WebFormKindFilter; label: string }[] = [
  { id: "ALL", label: "Todos" },
  { id: "CONTACT", label: WEB_FORM_KIND_LABELS.CONTACT },
  { id: "JOB_APPLICATION", label: WEB_FORM_KIND_LABELS.JOB_APPLICATION },
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
      <OpsViewTabs
        label="Estado de los formularios"
        value={filters.status}
        onValueChange={(status) => onChange({ ...filters, status })}
        views={STATUS_TABS.map((tab) => ({ ...tab, count: counts?.[tab.id] }))}
      >
        {null}
      </OpsViewTabs>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Tipo de formulario">
        {KIND_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={filters.kind === chip.id}
            onClick={() => onChange({ ...filters, kind: chip.id })}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
              filters.kind === chip.id
                ? "border-ops-bamboo-strong bg-ops-bamboo-soft font-medium text-ops-bamboo-strong"
                : "border-ops-border text-ops-text-muted hover:bg-ops-surface-muted"
            )}
          >
            {chip.label}
          </button>
        ))}
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
