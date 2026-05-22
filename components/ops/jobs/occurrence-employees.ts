import type { OpsOccurrence } from "@/components/ops/types";

const isOccurrenceEmployee = (
  employee: OpsOccurrence["employees"][number]["employee"]
): employee is NonNullable<OpsOccurrence["employees"][number]["employee"]> =>
  employee !== null;

export const getOccurrenceEmployees = (occurrence: OpsOccurrence) => {
  return occurrence.employees.map(({ employee }) => employee).filter(isOccurrenceEmployee);
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
