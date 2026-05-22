"use client";

import type { PaymentStatus } from "@prisma/client";

import {
  OpsDateFilterInput,
  OpsFilterChips,
  OpsFilterField,
  OpsFilterSheet,
  OpsRefreshButton,
  OpsToolbar,
  getOpsStatusConfig,
  opsFilterControlClass,
  opsPaymentStatus,
  type OpsFilterChip,
} from "@/components/ops/shared";
import type {
  OpsEmployee,
  OpsJobListItem,
  OpsOperationalCostCategory,
} from "@/components/ops/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CostsFilterState = {
  categoryId: string;
  employeeId: string;
  endDate: string;
  jobId: string;
  startDate: string;
  status: string;
};

export const CostsFilters = ({
  categories,
  employees,
  filters,
  isRefreshing,
  jobs,
  onChange,
  onClear,
  onRefresh,
}: {
  categories: OpsOperationalCostCategory[];
  employees: OpsEmployee[];
  filters: CostsFilterState;
  isRefreshing?: boolean;
  jobs: OpsJobListItem[];
  onChange: (values: Partial<CostsFilterState>) => void;
  onClear: () => void;
  onRefresh: () => Promise<unknown> | void;
}) => {
  const selectedCategory = categories.find(
    (category) => category.id === filters.categoryId
  );
  const selectedEmployee = employees.find(
    (employee) => employee.id === filters.employeeId
  );
  const selectedJob = jobs.find((job) => job.id === filters.jobId);
  const chips = [
    selectedCategory
      ? { label: `Categoria: ${selectedCategory.name}`, onRemove: () => onChange({ categoryId: "ALL" }) }
      : null,
    selectedEmployee
      ? { label: `Empleada: ${selectedEmployee.name}`, onRemove: () => onChange({ employeeId: "ALL" }) }
      : null,
    selectedJob
      ? { label: `Trabajo: ${selectedJob.name}`, onRemove: () => onChange({ jobId: "ALL" }) }
      : null,
    filters.status !== "ALL"
      ? { label: `Estado: ${getOpsStatusConfig(opsPaymentStatus, filters.status as PaymentStatus).label}`, onRemove: () => onChange({ status: "ALL" }) }
      : null,
  ].filter(Boolean) as OpsFilterChip[];

  const dateFields = (
    <>
      <OpsFilterField label="Desde">
        <OpsDateFilterInput
          value={filters.startDate}
          onChange={(event) => onChange({ startDate: event.target.value })}
        />
      </OpsFilterField>
      <OpsFilterField label="Hasta">
        <OpsDateFilterInput
          value={filters.endDate}
          onChange={(event) => onChange({ endDate: event.target.value })}
        />
      </OpsFilterField>
    </>
  );

  const selectFields = (
    <>
      <Select value={filters.categoryId} onValueChange={(categoryId) => onChange({ categoryId })}>
        <SelectTrigger className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas las categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(status) => onChange({ status })}>
        <SelectTrigger className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          <SelectItem value="RECORDED">Registrado</SelectItem>
          <SelectItem value="VOIDED">Anulado</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  const relationFields = (
    <>
      <Select value={filters.jobId} onValueChange={(jobId) => onChange({ jobId })}>
        <SelectTrigger className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los trabajos</SelectItem>
          {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.employeeId} onValueChange={(employeeId) => onChange({ employeeId })}>
        <SelectTrigger className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas las empleadas</SelectItem>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <OpsFilterSheet activeCount={chips.length} onClear={onClear}>
          {dateFields}
          {selectFields}
          {relationFields}
        </OpsFilterSheet>
      </div>
      <div className="hidden md:block">
        <OpsToolbar summary={`${chips.length} filtro(s) activo(s)`}>
          {dateFields}
          {selectFields}
          {relationFields}
          <OpsRefreshButton isRefreshing={isRefreshing} onRefresh={onRefresh} />
        </OpsToolbar>
      </div>
      <OpsFilterChips chips={chips} onClear={onClear} />
    </div>
  );
};
