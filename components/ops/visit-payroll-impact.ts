import {
  getCompletedVisitEmployees,
  getCompletedVisitHours,
} from "@/components/ops/compensation-utils";
import { formatHours } from "@/components/ops/employees/employee-payroll";
import type { OpsOccurrence } from "@/components/ops/types";
import { isPayrollWorkMonthTracked } from "@/lib/ops/finance/payroll-period";
import { DEFAULT_OPS_TIMEZONE, getLocalDate } from "@/lib/ops/timezone";

export type VisitPayrollImpact = {
  employees: { id: string; name: string }[];
  hours: number;
  // Salaries are paid in arrears: the payments of this month settle the hours.
  paymentMonthKey: string;
  workMonthName: string;
};

const toMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const formatMonthName = (year: number, month: number) =>
  new Intl.DateTimeFormat("es-UY", { month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .toLocaleLowerCase("es-UY");

const joinNames = (names: string[]) =>
  new Intl.ListFormat("es-UY", { type: "conjunction" }).format(names);

// What removing a visit takes off payroll. Payroll counts a done visit with
// employees: its real hours and one transport for each of them, in the month
// it was scheduled. Months before payroll tracking started have no balance.
export const getVisitPayrollImpact = (
  occurrence: OpsOccurrence,
  timeZone = DEFAULT_OPS_TIMEZONE
): VisitPayrollImpact | null => {
  const employees = getCompletedVisitEmployees(occurrence);
  if (!employees.length) return null;

  const { month, year } = getLocalDate(new Date(occurrence.scheduledStartAt), timeZone);
  if (!isPayrollWorkMonthTracked(toMonthKey(year, month))) return null;

  return {
    employees: employees.map(({ id, name }) => ({ id, name })),
    hours: getCompletedVisitHours(occurrence),
    paymentMonthKey: month === 12 ? toMonthKey(year + 1, 1) : toMonthKey(year, month + 1),
    workMonthName: formatMonthName(year, month),
  };
};

export const joinEmployeeNames = (employees: { name: string }[]) =>
  joinNames(employees.map((employee) => employee.name));

// The month's payments are already recorded for some of the employees.
export const formatPaidNotice = (
  impact: VisitPayrollImpact,
  paidEmployeeIds: readonly string[] = []
) => {
  const paid = impact.employees.filter((employee) => paidEmployeeIds.includes(employee.id));
  if (!paid.length) return null;
  const balance = paid.length > 1 ? "sus saldos cambian" : "su saldo cambia";
  return `Las horas de ${impact.workMonthName} ya tienen pagos cargados para ${joinEmployeeNames(paid)}: ${balance}.`;
};

export const formatVisitPayrollWarning = (
  impact: VisitPayrollImpact,
  paidEmployeeIds: readonly string[] = []
) => {
  const removed =
    impact.hours > 0
      ? `se restan ${formatHours(impact.hours)} hs y el transporte`
      : "se resta el transporte";
  const paid = formatPaidNotice(impact, paidEmployeeIds);
  return [
    `Es una visita realizada: ${removed} a ${joinEmployeeNames(impact.employees)} en los sueldos de ${impact.workMonthName}.`,
    ...(paid ? [paid] : []),
  ];
};
