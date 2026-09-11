import { formatCostMoney, toCostNumber } from "@/components/ops/costs/cost-utils";
import {
  formatMoney,
  toMoneyNumber,
  type buildEmployeeGeneratedPay,
} from "@/components/ops/payments/payment-utils";
import {
  formatPayrollMoney,
  toPayrollNumber,
  type buildPayrollRows,
} from "@/components/ops/payroll/payroll-utils";
import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsOperationalCost,
} from "@/components/ops/types";
import type {
  SearchFields,
  SortAccessors,
  SortState,
} from "@/lib/ops/table-query";

// Search fields and sort accessors for the Finance tables. Plain module on
// purpose: the tables pass these as memo dependencies (they must be stable),
// and scripts/check-finance-tables.ts exercises them without React.

export type PayrollRow = ReturnType<typeof buildPayrollRows>[number];
export type GeneratedPayRow = ReturnType<
  typeof buildEmployeeGeneratedPay
>["rows"][number];

const toTime = (value: Date | string) => new Date(value).getTime();

// Both spellings of an amount: "12900" as typed from a bank statement and
// "12.900" as read off the formatted column.
const amountSearchText = (amount: number, format: (value: number) => string) => {
  const raw = String(amount);
  return [raw, raw.replace(".", ","), format(amount)];
};

export type PaymentSortKey = "amount" | "date" | "job";

export const paymentSearchFields = (payment: OpsJobClientPayment): SearchFields => [
  payment.job.name,
  payment.reference,
  payment.notes,
  ...amountSearchText(toMoneyNumber(payment.amount), formatMoney),
];

export const paymentSortAccessors: SortAccessors<OpsJobClientPayment, PaymentSortKey> = {
  amount: (payment) => toMoneyNumber(payment.amount),
  date: (payment) => toTime(payment.paymentDate),
  job: (payment) => payment.job.name,
};

export const paymentInitialSort: SortState<PaymentSortKey> = {
  direction: "desc",
  key: "date",
};

export type CostSortKey = "amount" | "category" | "date";

export const costSearchFields = (cost: OpsOperationalCost): SearchFields => [
  cost.category.name,
  cost.job?.name,
  cost.employee?.name,
  cost.reference,
  cost.notes,
  ...amountSearchText(toCostNumber(cost.amount), formatCostMoney),
];

export const costSortAccessors: SortAccessors<OpsOperationalCost, CostSortKey> = {
  amount: (cost) => toCostNumber(cost.amount),
  category: (cost) => cost.category.name,
  date: (cost) => toTime(cost.costDate),
};

export const costInitialSort: SortState<CostSortKey> = {
  direction: "desc",
  key: "date",
};

export type EmployeePaymentSortKey = "amount" | "date" | "employee";

export const employeePaymentSearchFields = (
  payment: OpsEmployeePayment
): SearchFields => [
  payment.employee.name,
  payment.reference,
  payment.notes,
  ...amountSearchText(toPayrollNumber(payment.amount), formatPayrollMoney),
];

export const employeePaymentSortAccessors: SortAccessors<
  OpsEmployeePayment,
  EmployeePaymentSortKey
> = {
  amount: (payment) => toPayrollNumber(payment.amount),
  date: (payment) => toTime(payment.paymentDate),
  employee: (payment) => payment.employee.name,
};

export const employeePaymentInitialSort: SortState<EmployeePaymentSortKey> = {
  direction: "desc",
  key: "date",
};

export type PayrollSortKey =
  | "balance"
  | "employee"
  | "hours"
  | "recorded"
  | "suggested"
  | "visits";

export const payrollSearchFields = (row: PayrollRow): SearchFields => [
  row.employeeName,
];

export const payrollSortAccessors: SortAccessors<PayrollRow, PayrollSortKey> = {
  balance: (row) => row.balance,
  employee: (row) => row.employeeName,
  hours: (row) => row.hours,
  recorded: (row) => row.recordedTotal,
  suggested: (row) => row.suggestedAmount,
  visits: (row) => row.visits,
};

// Alphabetical, like buildPayrollRows already returns them.
export const payrollInitialSort: SortState<PayrollSortKey> = {
  direction: "asc",
  key: "employee",
};

export type GeneratedPaySortKey = "amount" | "employee" | "hours" | "visits";

export const generatedPaySearchFields = (row: GeneratedPayRow): SearchFields => [
  row.employeeName,
];

export const generatedPaySortAccessors: SortAccessors<
  GeneratedPayRow,
  GeneratedPaySortKey
> = {
  amount: (row) => row.amount,
  employee: (row) => row.employeeName,
  hours: (row) => row.hours,
  visits: (row) => row.visits,
};

// Biggest first, like buildEmployeeGeneratedPay already returns them.
export const generatedPayInitialSort: SortState<GeneratedPaySortKey> = {
  direction: "desc",
  key: "amount",
};

// Footer total of the rows a table is showing: voided records stay visible as
// history but never add up, same rule as the section's KPIs.
export const sumRecordedAmounts = <Row extends { amount: unknown; status: string }>(
  rows: readonly Row[],
  toNumber: (value: unknown) => number
) =>
  rows.reduce(
    (total, row) => (row.status === "RECORDED" ? total + toNumber(row.amount) : total),
    0
  );
