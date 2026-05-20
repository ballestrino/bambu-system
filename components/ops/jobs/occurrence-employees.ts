import type { OpsOccurrence } from "@/components/ops/types";

export const getOccurrenceEmployees = (occurrence: OpsOccurrence) => {
  const employees = occurrence.employees.map(({ employee }) => employee);

  if (employees.length) {
    return employees;
  }

  return occurrence.employee ? [occurrence.employee] : [];
};

export const getOccurrenceEmployeeIds = (occurrence?: OpsOccurrence) =>
  occurrence ? getOccurrenceEmployees(occurrence).map((employee) => employee.id) : [];

export const hasOccurrenceEmployees = (occurrence: OpsOccurrence) =>
  getOccurrenceEmployees(occurrence).length > 0;

export const getOccurrenceEmployeesLabel = (occurrence: OpsOccurrence) => {
  const employees = getOccurrenceEmployees(occurrence);

  return employees.length
    ? employees.map((employee) => employee.name).join(", ")
    : "Sin empleadas asignadas";
};
