import type { OpsOccurrence } from "@/components/ops/types";
import { getOccurrenceEmployees } from "@/components/ops/jobs/occurrence-employees";
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";

export const getLastWeekRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { start, end };
};

export const getMonthRangeValues = (month: Date) => {
  const { start, end } = getMonthRange(month);
  return {
    endDate: toDateInputValue(end),
    startDate: toDateInputValue(start),
  };
};

export const getOccurrenceEmployeeOptions = (
  occurrences: OpsOccurrence[]
) => {
  const employees = new Map<string, NonNullable<OpsOccurrence["employee"]>>();

  for (const occurrence of occurrences) {
    for (const employee of getOccurrenceEmployees(occurrence)) {
      employees.set(employee.id, employee);
    }
  }

  return Array.from(employees.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "es")
  );
};
