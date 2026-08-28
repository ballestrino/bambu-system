"use client";

import {
  ALL_CALENDAR_FILTER,
  UNASSIGNED_EMPLOYEE_FILTER,
  type CalendarFilterOption,
  type CalendarFilters,
} from "@/components/ops/calendar/calendar-filter-utils";
import {
  getOpsStatusConfig,
  OpsDateFilterInput,
  OpsFilterField,
  opsFilterControlClass,
  opsFilterToggleClass,
  opsOccurrenceStatus,
  opsSwitchClass,
} from "@/components/ops/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { occurrenceStatusValues } from "@/schemas/ops";

export const CalendarFilterFields = ({
  employeeOptions,
  exactDate,
  filters,
  jobOptions,
  onChange,
  onExactDateChange,
}: {
  employeeOptions: CalendarFilterOption[];
  exactDate?: string;
  filters: CalendarFilters;
  jobOptions: CalendarFilterOption[];
  onChange: (changes: Partial<CalendarFilters>) => void;
  onExactDateChange?: (date: string) => void;
}) => (
  <div className={`grid gap-3 sm:grid-cols-2 ${onExactDateChange ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
    {onExactDateChange ? (
      <OpsFilterField label="Fecha exacta">
        <OpsDateFilterInput
          aria-label="Filtrar por fecha exacta"
          onChange={(event) => onExactDateChange(event.target.value)}
          value={exactDate ?? ""}
        />
      </OpsFilterField>
    ) : null}
    <OpsFilterField label="Trabajo">
      <SearchableSelect
        aria-label="Filtrar por trabajo"
        className={opsFilterControlClass}
        onValueChange={(jobId) => onChange({ jobId })}
        options={[
          { label: "Todos los trabajos", value: ALL_CALENDAR_FILTER },
          ...jobOptions.map((job) => ({ label: job.name, value: job.id })),
        ]}
        searchPlaceholder="Buscar trabajo..."
        value={filters.jobId}
      />
    </OpsFilterField>
    <OpsFilterField label="Empleada">
      <SearchableSelect
        aria-label="Filtrar por empleada"
        className={opsFilterControlClass}
        onValueChange={(employeeId) => onChange({ employeeId })}
        options={[
          { label: "Todas las empleadas", value: ALL_CALENDAR_FILTER },
          { label: "Sin asignar", value: UNASSIGNED_EMPLOYEE_FILTER },
          ...employeeOptions.map((employee) => ({ label: employee.name, value: employee.id })),
        ]}
        searchPlaceholder="Buscar empleada..."
        value={filters.employeeId}
      />
    </OpsFilterField>
    <OpsFilterField label="Estado">
      <Select value={filters.status} onValueChange={(status) => onChange({ status: status as CalendarFilters["status"] })}>
        <SelectTrigger aria-label="Filtrar por estado" className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CALENDAR_FILTER}>Todos los estados</SelectItem>
          {occurrenceStatusValues.map((status) => (
            <SelectItem key={status} value={status}>{getOpsStatusConfig(opsOccurrenceStatus, status).label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </OpsFilterField>
    <OpsFilterField label="Seguimiento">
      <label className={`${opsFilterToggleClass} md:w-full`}>
        Solo requieren atención
        <Switch checked={filters.attentionOnly} className={opsSwitchClass} onCheckedChange={(attentionOnly) => onChange({ attentionOnly })} />
      </label>
    </OpsFilterField>
  </div>
);
