"use client";

import type { PaymentStatus } from "@prisma/client";

import {
  OpsFilterChips,
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CostsFilterState = {
  categoryId: string;
  employeeId: string;
  jobId: string;
  status: string;
};

export const CostsFilters = ({
  categories,
  employees,
  filters,
  isRefreshing,
  jobs,
  monthLabel,
  onChange,
  onClear,
  onRefresh,
}: {
  categories: OpsOperationalCostCategory[];
  employees: OpsEmployee[];
  filters: CostsFilterState;
  isRefreshing?: boolean;
  jobs: OpsJobListItem[];
  monthLabel: string;
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
    { label: `Mes: ${monthLabel}` },
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

  const selectFields = (
    <>
      <SearchableSelect
        aria-label="Filtrar por categoría"
        className={opsFilterControlClass}
        onValueChange={(categoryId) => onChange({ categoryId })}
        options={[
          { label: "Todas las categorías", value: "ALL" },
          ...categories.map((category) => ({ label: category.name, value: category.id })),
        ]}
        searchPlaceholder="Buscar categoría..."
        value={filters.categoryId}
      />
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
      <SearchableSelect
        aria-label="Filtrar por trabajo"
        className={opsFilterControlClass}
        onValueChange={(jobId) => onChange({ jobId })}
        options={[
          { label: "Todos los trabajos", value: "ALL" },
          ...jobs.map((job) => ({ label: job.name, value: job.id })),
        ]}
        searchPlaceholder="Buscar trabajo..."
        value={filters.jobId}
      />
      <SearchableSelect
        aria-label="Filtrar por empleada"
        className={opsFilterControlClass}
        onValueChange={(employeeId) => onChange({ employeeId })}
        options={[
          { label: "Todas las empleadas", value: "ALL" },
          ...employees.map((employee) => ({ label: employee.name, value: employee.id })),
        ]}
        searchPlaceholder="Buscar empleada..."
        value={filters.employeeId}
      />
    </>
  );

  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <OpsFilterSheet activeCount={chips.length} onClear={onClear}>
          {selectFields}
          {relationFields}
        </OpsFilterSheet>
      </div>
      <div className="hidden md:block">
        <OpsToolbar summary={`${chips.length} filtro(s) activo(s)`}>
          {selectFields}
          {relationFields}
          <OpsRefreshButton isRefreshing={isRefreshing} onRefresh={onRefresh} />
        </OpsToolbar>
      </div>
      <OpsFilterChips chips={chips} onClear={onClear} />
    </div>
  );
};
