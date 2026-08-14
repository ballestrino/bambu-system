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
      <Select value={filters.jobId} onValueChange={(jobId) => onChange({ jobId })}>
        <SelectTrigger aria-label="Filtrar por trabajo" className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CALENDAR_FILTER}>Todos los trabajos</SelectItem>
          {jobOptions.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </OpsFilterField>
    <OpsFilterField label="Empleada">
      <Select value={filters.employeeId} onValueChange={(employeeId) => onChange({ employeeId })}>
        <SelectTrigger aria-label="Filtrar por empleada" className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CALENDAR_FILTER}>Todas las empleadas</SelectItem>
          <SelectItem value={UNASSIGNED_EMPLOYEE_FILTER}>Sin asignar</SelectItem>
          {employeeOptions.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}
        </SelectContent>
      </Select>
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
