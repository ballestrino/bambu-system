"use client";

import type { JobOccurrenceEmployeeOption } from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { OpsFormField, opsFormSelectTriggerClass } from "@/components/ops/shared";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";

const getOptionLabel = (employee: JobOccurrenceEmployeeOption) => {
  if (employee.archivedAt) return `${employee.name} (archivada)`;
  return employee.isActive ? employee.name : `${employee.name} (inactiva)`;
};

export const JobOccurrenceEmployeeField = ({
  employees,
  onChange,
  selectedEmployeeIds,
}: {
  employees: JobOccurrenceEmployeeOption[];
  onChange: (employeeIds: string[]) => void;
  selectedEmployeeIds: string[];
}) => (
  <OpsFormField
    description="Las empleadas archivadas o inactivas solo aparecen si ya estaban asignadas y pueden quitarse."
    label="Equipo"
  >
    <SearchableMultiSelect
      aria-label="Seleccionar empleadas"
      className={opsFormSelectTriggerClass}
      emptyMessage="No hay empleadas para ese nombre."
      onValueChange={onChange}
      options={employees.map((employee) => ({
        label: getOptionLabel(employee),
        value: employee.id,
      }))}
      placeholder={employees.length ? "Sin empleadas asignadas" : "No hay empleadas activas"}
      searchPlaceholder="Buscar empleada..."
      summaryLabel={(count) => `${count} empleadas`}
      values={selectedEmployeeIds}
    />
  </OpsFormField>
);
