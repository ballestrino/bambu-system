"use client";
import { CalendarFilterFields } from "@/components/ops/calendar/calendar-filter-fields";
import {
  ALL_CALENDAR_FILTER,
  UNASSIGNED_EMPLOYEE_FILTER,
  hasActiveCalendarFilters,
  type CalendarFilterOption,
  type CalendarFilters,
} from "@/components/ops/calendar/calendar-filter-utils";
import {
  getOpsStatusConfig,
  OpsFilterChips,
  opsOccurrenceStatus,
  opsSurface,
  type OpsFilterChip,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";

type CalendarFiltersProps = {
  countLabel?: string;
  employeeOptions: CalendarFilterOption[];
  exactDate?: string;
  filters: CalendarFilters;
  jobOptions: CalendarFilterOption[];
  onChange: (changes: Partial<CalendarFilters>) => void;
  onClear: () => void;
  onExactDateChange?: (date: string) => void;
  totalCount: number;
  visibleCount: number;
};
export const CalendarFiltersBar = ({
  countLabel,
  employeeOptions,
  exactDate,
  filters,
  jobOptions,
  onChange,
  onClear,
  onExactDateChange,
  totalCount,
  visibleCount,
}: CalendarFiltersProps) => {
  const selectedJob = jobOptions.find(({ id }) => id === filters.jobId);
  const selectedEmployee = employeeOptions.find(
    ({ id }) => id === filters.employeeId
  );
  const selectedStatus =
    filters.status === ALL_CALENDAR_FILTER
      ? null
      : getOpsStatusConfig(opsOccurrenceStatus, filters.status);
  const chips = [
    selectedJob
      ? {
          label: `Trabajo: ${selectedJob.name}`,
          onRemove: () => onChange({ jobId: ALL_CALENDAR_FILTER }),
        }
      : null,
    filters.employeeId === UNASSIGNED_EMPLOYEE_FILTER
      ? {
          label: "Empleada: Sin asignar",
          onRemove: () => onChange({ employeeId: ALL_CALENDAR_FILTER }),
        }
      : selectedEmployee
        ? {
            label: `Empleada: ${selectedEmployee.name}`,
            onRemove: () => onChange({ employeeId: ALL_CALENDAR_FILTER }),
          }
        : null,
    selectedStatus
      ? {
          label: `Estado: ${selectedStatus.label}`,
          onRemove: () => onChange({ status: ALL_CALENDAR_FILTER }),
        }
      : null,
    filters.attentionOnly
      ? {
          label: "Requieren atención",
          onRemove: () => onChange({ attentionOnly: false }),
        }
      : null,
    exactDate
      ? {
          label: `Fecha: ${new Date(`${exactDate}T12:00:00`).toLocaleDateString("es-UY")}`,
          onRemove: () => onExactDateChange?.(""),
        }
      : null,
  ].filter(Boolean) as OpsFilterChip[];
  const hasFilters = hasActiveCalendarFilters(filters) || Boolean(exactDate);
  return (
    <div className="space-y-3">
      <section className={`${opsSurface.toolbar} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#18251D] dark:text-[#F0F3E8]">
              Filtrar visitas
            </h2>
            <p className="text-xs text-muted-foreground">
              Los filtros se aplican a la visualización activa.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {countLabel ?? `${visibleCount} de ${totalCount} visita(s)`}
            </span>
            {hasFilters ? (
              <Button type="button" size="sm" variant="ghost" onClick={onClear}>
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>

        <CalendarFilterFields
          employeeOptions={employeeOptions}
          exactDate={exactDate}
          filters={filters}
          jobOptions={jobOptions}
          onChange={onChange}
          onExactDateChange={onExactDateChange}
        />
      </section>
      <OpsFilterChips chips={chips} onClear={onClear} />
    </div>
  );
};
