"use client";

import {
  getOpsStatusConfig,
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PayrollFiltersProps = {
  employeeId: string;
  employees: OpsEmployee[];
  isRefreshing?: boolean;
  monthLabel: string;
  onClear: () => void;
  onEmployeeIdChange: (value: string) => void;
  onRefresh: () => Promise<unknown> | void;
  onStatusChange: (value: string) => void;
  status: string;
};

export const PayrollFilters = ({
  employeeId,
  employees,
  isRefreshing,
  monthLabel,
  onClear,
  onEmployeeIdChange,
  onRefresh,
  onStatusChange,
  status,
}: PayrollFiltersProps) => {
  const selectedStatus =
    status === "ALL" ? null : getOpsStatusConfig(opsPaymentStatus, status);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const chips = [
    { label: `Mes: ${monthLabel}` },
    selectedStatus ? { label: `Estado: ${selectedStatus.label}`, onRemove: () => onStatusChange("ALL") } : null,
    selectedEmployee ? { label: `Empleado: ${selectedEmployee.name}`, onRemove: () => onEmployeeIdChange("ALL") } : null,
  ].filter(Boolean) as OpsFilterChip[];

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
      <SearchableSelect
        aria-label="Filtrar por empleada"
        className={opsFilterControlClass}
        onValueChange={onEmployeeIdChange}
        options={[
          { label: "Todos", value: "ALL" },
          ...employees.map((employee) => ({ label: employee.name, value: employee.id })),
        ]}
        searchPlaceholder="Buscar empleada..."
        value={employeeId}
      />
    </OpsFilterField>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        <div className="flex gap-2">
          <OpsFilterSheet
            activeCount={chips.length}
            description="Ajusta estado y empleada para revisar pagos."
            onClear={onClear}
          >
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
