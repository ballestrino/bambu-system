"use client";
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
  OpsFilterField,
  opsFilterControlClass,
  opsFilterToggleClass,
  opsOccurrenceStatus,
  opsSurface,
  opsSwitchClass,
  type OpsFilterChip,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { occurrenceStatusValues } from "@/schemas/ops";

type CalendarFiltersProps = {
  countLabel?: string;
  employeeOptions: CalendarFilterOption[];
  filters: CalendarFilters;
  jobOptions: CalendarFilterOption[];
  onChange: (changes: Partial<CalendarFilters>) => void;
  onClear: () => void;
  totalCount: number;
  visibleCount: number;
};
export const CalendarFiltersBar = ({
  countLabel,
  employeeOptions,
  filters,
  jobOptions,
  onChange,
  onClear,
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
  ].filter(Boolean) as OpsFilterChip[];
  const hasFilters = hasActiveCalendarFilters(filters);
  return (
    <div className="space-y-3">
      <section className={`${opsSurface.toolbar} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#18251D] dark:text-[#EAF5EC]">
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OpsFilterField label="Trabajo">
            <Select
              value={filters.jobId}
              onValueChange={(jobId) => onChange({ jobId })}
            >
              <SelectTrigger
                aria-label="Filtrar por trabajo"
                className={opsFilterControlClass}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CALENDAR_FILTER}>
                  Todos los trabajos
                </SelectItem>
                {jobOptions.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFilterField>

          <OpsFilterField label="Empleada">
            <Select
              value={filters.employeeId}
              onValueChange={(employeeId) => onChange({ employeeId })}
            >
              <SelectTrigger
                aria-label="Filtrar por empleada"
                className={opsFilterControlClass}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CALENDAR_FILTER}>
                  Todas las empleadas
                </SelectItem>
                <SelectItem value={UNASSIGNED_EMPLOYEE_FILTER}>
                  Sin asignar
                </SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFilterField>

          <OpsFilterField label="Estado">
            <Select
              value={filters.status}
              onValueChange={(status) => onChange({ status: status as CalendarFilters["status"] })}
            >
              <SelectTrigger
                aria-label="Filtrar por estado"
                className={opsFilterControlClass}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CALENDAR_FILTER}>
                  Todos los estados
                </SelectItem>
                {occurrenceStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getOpsStatusConfig(opsOccurrenceStatus, status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OpsFilterField>

          <OpsFilterField label="Seguimiento">
            <label className={`${opsFilterToggleClass} md:w-full`}>
              Solo requieren atención
              <Switch
                checked={filters.attentionOnly}
                className={opsSwitchClass}
                onCheckedChange={(attentionOnly) => onChange({ attentionOnly })}
              />
            </label>
          </OpsFilterField>
        </div>
      </section>
      <OpsFilterChips chips={chips} onClear={onClear} />
    </div>
  );
};
