import { isValidDateInput } from "@/components/ops/employees/employee-summary-utils";
import { buildPayrollRows } from "@/components/ops/payroll/payroll-utils";
import type { OpsEmployee, OpsOccurrence } from "@/components/ops/types";
import { toDateInputValue } from "@/components/ops/utils";

export type EmployeeAccrualRow = {
  aguinaldoGenerated: number | null;
  employeeId: string;
  employeeName: string;
  hourlyRate: number | null;
  hours: number;
  laborAmount: number | null;
  totalGenerated: number | null;
  vacationSalaryGenerated: number | null;
  visits: number;
};

export const getYearRange = (reference: Date) => ({
  end: new Date(reference.getFullYear(), 11, 31, 23, 59, 59),
  start: new Date(reference.getFullYear(), 0, 1),
});

// El aguinaldo uruguayo se genera por semestres: 1 de junio a 30 de noviembre
// y 1 de diciembre a 31 de mayo.
export const getAguinaldoPeriodRange = (reference: Date) => {
  const month = reference.getMonth();
  const year = reference.getFullYear();

  if (month >= 5 && month <= 10) {
    return {
      end: new Date(year, 10, 30, 23, 59, 59),
      start: new Date(year, 5, 1),
    };
  }

  const startYear = month === 11 ? year : year - 1;
  return {
    end: new Date(startYear + 1, 4, 31, 23, 59, 59),
    start: new Date(startYear, 11, 1),
  };
};

export const getInitialEmployeeAccrualsRange = (start?: string, end?: string) => {
  const currentYear = getYearRange(new Date());

  return {
    endDate: isValidDateInput(end) ? end ?? "" : toDateInputValue(currentYear.end),
    startDate: isValidDateInput(start)
      ? start ?? ""
      : toDateInputValue(currentYear.start),
  };
};

export const buildEmployeeAccrualRows = (
  employees: OpsEmployee[],
  occurrences: OpsOccurrence[]
): EmployeeAccrualRow[] =>
  buildPayrollRows(employees, occurrences, []).map((row) => ({
    aguinaldoGenerated: row.aguinaldoGenerated,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    hourlyRate: row.hourlyRate,
    hours: row.hours,
    laborAmount: row.hourlyRate === null ? null : row.hours * row.hourlyRate,
    totalGenerated:
      row.aguinaldoGenerated === null || row.vacationSalaryGenerated === null
        ? null
        : row.aguinaldoGenerated + row.vacationSalaryGenerated,
    vacationSalaryGenerated: row.vacationSalaryGenerated,
    visits: row.visits,
  }));

export const getEmployeeAccrualTotals = (rows: EmployeeAccrualRow[]) => {
  const aguinaldoTotal = rows.reduce(
    (sum, row) => sum + (row.aguinaldoGenerated ?? 0),
    0
  );
  const vacationSalaryTotal = rows.reduce(
    (sum, row) => sum + (row.vacationSalaryGenerated ?? 0),
    0
  );

  return {
    aguinaldoTotal,
    employeesWithoutRate: rows.filter((row) => row.hourlyRate === null).length,
    grandTotal: aguinaldoTotal + vacationSalaryTotal,
    hoursTotal: rows.reduce((sum, row) => sum + row.hours, 0),
    vacationSalaryTotal,
  };
};
