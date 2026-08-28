"use client";
import { SlidersHorizontal } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const resultCount = countLabel ?? `${visibleCount} de ${totalCount} visita(s)`;
  const filterFields = (
    <CalendarFilterFields
      employeeOptions={employeeOptions}
      exactDate={exactDate}
      filters={filters}
      jobOptions={jobOptions}
      onChange={onChange}
      onExactDateChange={onExactDateChange}
    />
  );

  return (
    <div className="space-y-3">
      <section className={`${opsSurface.toolbar} hidden space-y-3 md:block`}>
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
            <span>{resultCount}</span>
            {hasFilters ? (
              <Button type="button" size="sm" variant="ghost" onClick={onClear}>
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>
        {filterFields}
      </section>

      <section className={`${opsSurface.toolbar} flex items-center justify-between gap-3 md:hidden`}>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#18251D] dark:text-[#F0F3E8]">
            Filtrar visitas
          </h2>
          <p className="truncate text-xs text-muted-foreground">{resultCount}</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="min-h-11 shrink-0 border-ops-border shadow-none"
              type="button"
              variant="outline"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {chips.length ? (
                <Badge className="ml-1 bg-ops-bamboo-strong text-white dark:text-[#18251D]">
                  {chips.length}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent
            className="max-h-[85dvh] rounded-t-2xl bg-background pb-[max(1rem,env(safe-area-inset-bottom))]"
            side="bottom"
          >
            <SheetHeader className="text-left">
              <SheetTitle>Filtrar visitas</SheetTitle>
              <SheetDescription>
                Los cambios se aplican a la visualización activa.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              {filterFields}
            </div>
            <SheetFooter className="border-t border-ops-border pt-3 sm:flex-row sm:justify-end">
              <Button
                disabled={!hasFilters}
                onClick={onClear}
                type="button"
                variant="outline"
              >
                Limpiar filtros
              </Button>
              <SheetClose asChild>
                <Button type="button">Listo</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </section>
      <OpsFilterChips chips={chips} onClear={onClear} />
    </div>
  );
};
