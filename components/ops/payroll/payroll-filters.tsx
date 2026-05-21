"use client";

import {
  getOpsStatusConfig,
  OpsDateFilterInput,
  OpsFilterChips,
  OpsFilterField,
  OpsFilterSheet,
  OpsRefreshButton,
  OpsToolbar,
  opsFilterControlClass,
  opsPaymentStatus,
  type OpsFilterChip,
} from "@/components/ops/shared";
import type { OpsEmployee } from "@/components/ops/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PayrollFiltersProps = {
  employeeId: string;
  employees: OpsEmployee[];
  endDate: string;
  isRefreshing?: boolean;
  onClear: () => void;
  onEmployeeIdChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRefresh: () => Promise<unknown> | void;
  onStartDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  startDate: string;
  status: string;
};

export const PayrollFilters = ({
  employeeId,
  employees,
  endDate,
  isRefreshing,
  onClear,
  onEmployeeIdChange,
  onEndDateChange,
  onRefresh,
  onStartDateChange,
  onStatusChange,
  startDate,
  status,
}: PayrollFiltersProps) => {
  const selectedStatus =
    status === "ALL" ? null : getOpsStatusConfig(opsPaymentStatus, status);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const chips = [
    startDate ? { label: `Desde: ${startDate}`, onRemove: () => onStartDateChange("") } : null,
    endDate ? { label: `Hasta: ${endDate}`, onRemove: () => onEndDateChange("") } : null,
    selectedStatus ? { label: `Estado: ${selectedStatus.label}`, onRemove: () => onStatusChange("ALL") } : null,
    selectedEmployee ? { label: `Empleado: ${selectedEmployee.name}`, onRemove: () => onEmployeeIdChange("ALL") } : null,
  ].filter(Boolean) as OpsFilterChip[];

  const startField = (
    <OpsFilterField label="Periodo desde">
      <OpsDateFilterInput
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
      />
    </OpsFilterField>
  );

  const endField = (
    <OpsFilterField label="Periodo hasta">
      <OpsDateFilterInput
        value={endDate}
        onChange={(event) => onEndDateChange(event.target.value)}
      />
    </OpsFilterField>
  );

  const statusField = (
    <OpsFilterField label="Estado">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="RECORDED">Registrados</SelectItem>
          <SelectItem value="VOIDED">Anulados</SelectItem>
        </SelectContent>
      </Select>
    </OpsFilterField>
  );

  const employeeField = (
    <OpsFilterField label="Empleado">
      <Select value={employeeId} onValueChange={onEmployeeIdChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </OpsFilterField>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        <div className="flex gap-2">
          <OpsFilterSheet
            activeCount={chips.length}
            description="Ajusta periodo, estado y empleada para revisar pagos."
            onClear={onClear}
          >
            {startField}
            {endField}
            {statusField}
            {employeeField}
          </OpsFilterSheet>
          <OpsRefreshButton
            className="px-3"
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        </div>
        <OpsFilterChips chips={chips} onClear={onClear} />
      </div>

      <div className="hidden space-y-3 md:block">
        <OpsToolbar summary={`${chips.length} filtro(s) activo(s)`}>
          {startField}
          {endField}
          {statusField}
          {employeeField}
          <OpsRefreshButton
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        </OpsToolbar>
        <OpsFilterChips chips={chips} onClear={onClear} />
      </div>
    </div>
  );
};
