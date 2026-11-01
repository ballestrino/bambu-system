"use client";

import { opsFilterControlClass } from "@/components/ops/shared/ops-filter-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getFilterGroups,
  setBillingFilter,
  type BillingFilters,
  type BillingView,
} from "@/lib/billing/billing-list-filters";
import { cn } from "@/lib/utils";

const ALL = "all";

// Los campos de filtro (48): un desplegable por grupo con "Todos". "md" va en
// el panel plegable de escritorio, en columnas; "lg" en la hoja del teléfono,
// apilados y grandes como los filtros de Visitas.
export const BillingFilterPanel = ({
  filters,
  onChange,
  size = "md",
  view,
}: {
  filters: BillingFilters;
  onChange: (filters: BillingFilters) => void;
  size?: "md" | "lg";
  view: BillingView;
}) => {
  const large = size === "lg";
  return (
    <div className={cn("grid", large ? "grid-cols-1 gap-[18px]" : "gap-3 sm:grid-cols-3")}>
      {getFilterGroups(view).map((group) => (
        <label className="flex min-w-0 flex-col gap-1.5" key={group.key}>
          <span
            className={cn(
              "font-semibold text-ops-text-muted",
              large ? "text-[13px]" : "text-xs font-medium tracking-wide uppercase"
            )}
          >
            {group.label}
          </span>
          <Select
            onValueChange={(value) =>
              onChange(setBillingFilter(filters, group.key, value === ALL ? null : (value as (typeof group.options)[number]["value"])))
            }
            value={filters[group.key] ?? ALL}
          >
            <SelectTrigger
              aria-label={group.label}
              className={cn(opsFilterControlClass, large && "h-[52px]! min-h-[52px] rounded-[14px] text-base data-[size=default]:h-[52px]!")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ))}
    </div>
  );
};
