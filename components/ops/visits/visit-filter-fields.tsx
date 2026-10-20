"use client";

import {
  ALL_CALENDAR_FILTER,
  UNASSIGNED_EMPLOYEE_FILTER,
  type CalendarFilterOption,
  type CalendarFilters,
} from "@/components/ops/calendar/calendar-filter-utils";
import { getOpsStatusConfig, opsOccurrenceStatus } from "@/components/ops/shared";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { occurrenceStatusValues } from "@/schemas/ops";

const STATUS_OPTIONS = [
  { label: "Todos", value: ALL_CALENDAR_FILTER },
  ...occurrenceStatusValues.map((status) => ({
    label: getOpsStatusConfig(opsOccurrenceStatus, status).label,
    value: status,
  })),
];

// Campos del filtro de Visitas (3a y 2a): trabajo y empleada, estado en
// chips y el interruptor de "solo requieren atencion".
export const VisitFilterFields = ({
  employeeOptions,
  filters,
  jobOptions,
  onChange,
  size = "md",
}: {
  employeeOptions: CalendarFilterOption[];
  filters: CalendarFilters;
  jobOptions: CalendarFilterOption[];
  onChange: (changes: Partial<CalendarFilters>) => void;
  size?: "lg" | "md";
}) => {
  const large = size === "lg";
  const label = cn("font-semibold text-ops-text-muted", large ? "text-[13px]" : "text-xs");
  const control = cn("w-full rounded-[9px] border-ops-border shadow-none", large ? "h-[52px] rounded-[14px] text-base" : "h-[38px] text-[13px]");

  return (
    <div className={cn("flex flex-col", large ? "gap-[18px]" : "gap-3.5")}>
      <div className={cn("grid gap-2.5", large ? "grid-cols-1 gap-[18px]" : "grid-cols-2")}>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={label}>Trabajo</span>
          <SearchableSelect
            aria-label="Filtrar por trabajo"
            className={control}
            onValueChange={(jobId) => onChange({ jobId })}
            options={[
              { label: large ? "Todos los trabajos" : "Todos", value: ALL_CALENDAR_FILTER },
              ...jobOptions.map((job) => ({ label: job.name, value: job.id })),
            ]}
            searchPlaceholder="Buscar trabajo..."
            value={filters.jobId}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={label}>Empleada</span>
          <SearchableSelect
            aria-label="Filtrar por empleada"
            className={control}
            onValueChange={(employeeId) => onChange({ employeeId })}
            options={[
              { label: large ? "Todas las empleadas" : "Todas", value: ALL_CALENDAR_FILTER },
              { label: "Sin asignar", value: UNASSIGNED_EMPLOYEE_FILTER },
              ...employeeOptions.map((employee) => ({ label: employee.name, value: employee.id })),
            ]}
            searchPlaceholder="Buscar empleada..."
            value={filters.employeeId}
          />
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Estado</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Estado">
          {STATUS_OPTIONS.map((option) => {
            const active = filters.status === option.value;
            return (
              <button
                aria-checked={active}
                className={cn(
                  "inline-flex items-center rounded-full whitespace-nowrap transition-colors",
                  large ? "h-10 px-3.5 text-sm" : "h-[30px] px-[11px] text-[12.5px]",
                  active
                    ? "bg-ops-bamboo-strong font-semibold text-white dark:text-ops-canvas"
                    : "border border-ops-border text-ops-text hover:bg-ops-surface-muted"
                )}
                key={option.value}
                onClick={() => onChange({ status: option.value as CalendarFilters["status"] })}
                role="radio"
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <label
        className={cn(
          "flex cursor-pointer items-center justify-between border border-ops-border text-ops-text",
          large ? "min-h-14 rounded-[14px] px-3.5 text-base" : "h-[42px] rounded-[10px] px-3 text-[13.5px]"
        )}
      >
        Solo requieren atención
        <Switch checked={filters.attentionOnly} onCheckedChange={(attentionOnly) => onChange({ attentionOnly })} />
      </label>
    </div>
  );
};
