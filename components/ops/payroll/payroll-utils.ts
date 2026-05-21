import type {
  OpsEmployee,
  OpsEmployeePayment,
  OpsOccurrence,
} from "@/components/ops/types";
import {
  TRANSPORTATION_PAY_PER_VISIT,
  getCompletedVisitEmployees,
  getCompletedVisitHours,
  getEmployeeHourlyRate,
  isCompletedEmployeeVisit,
} from "@/components/ops/compensation-utils";

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

export const toPayrollNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatPayrollMoney = (amount: number) => moneyFormat.format(amount);

export const getEmployeeRate = getEmployeeHourlyRate;

export const getPayrollHours = getCompletedVisitHours;

export const getPaymentSummary = (payments: OpsEmployeePayment[]) =>
  payments.reduce(
    (acc, payment) => {
      const amount = toPayrollNumber(payment.amount);
      if (payment.status === "RECORDED") {
        acc.recordedTotal += amount;
        acc.recordedCount += 1;
      } else {
        acc.voidedTotal += amount;
        acc.voidedCount += 1;
      }
      return acc;
    },
    { recordedTotal: 0, recordedCount: 0, voidedTotal: 0, voidedCount: 0 }
  );

export const buildPayrollRows = (
  employees: OpsEmployee[],
  occurrences: OpsOccurrence[],
  payments: OpsEmployeePayment[]
) => {
  const rows = new Map<string, {
    balance: number | null;
    employeeId: string;
    employeeName: string;
    hours: number;
    hourlyRate: number | null;
    recordedTotal: number;
    suggestedAmount: number | null;
    transportationAmount: number;
    visits: number;
    voidedTotal: number;
  }>();

  const ensureRow = (employee: Pick<OpsEmployee, "id" | "name" | "hourlyRate">) => {
    const current = rows.get(employee.id);
    if (current) return current;

    const row = {
      balance: null,
      employeeId: employee.id,
      employeeName: employee.name,
      hours: 0,
      hourlyRate: getEmployeeRate(employee),
      recordedTotal: 0,
      suggestedAmount: null,
      transportationAmount: 0,
      visits: 0,
      voidedTotal: 0,
    };
    rows.set(employee.id, row);
    return row;
  };

  employees.forEach(ensureRow);
  const visibleEmployeeIds = new Set(employees.map((employee) => employee.id));

  occurrences.forEach((occurrence) => {
    const assignedEmployees = getCompletedVisitEmployees(occurrence).filter(
      (employee) => visibleEmployeeIds.has(employee.id)
    );
    if (!assignedEmployees.length) return;

    const workedHours = getPayrollHours(occurrence);
    const isCompletedVisit = isCompletedEmployeeVisit(occurrence);

    assignedEmployees.forEach((employee) => {
      const row = ensureRow(employee);
      row.hours += workedHours;

      if (isCompletedVisit) {
        row.transportationAmount += TRANSPORTATION_PAY_PER_VISIT;
        row.visits += 1;
      }
    });
  });
  payments.forEach((payment) => {
    const row = ensureRow(payment.employee);
    if (payment.status === "RECORDED") {
      row.recordedTotal += toPayrollNumber(payment.amount);
    } else {
      row.voidedTotal += toPayrollNumber(payment.amount);
    }
  });

  return Array.from(rows.values())
    .map((row) => {
      const suggestedAmount =
        row.hourlyRate === null
          ? null
          : row.hours * row.hourlyRate + row.transportationAmount;
      return {
        ...row,
        balance: suggestedAmount === null ? null : suggestedAmount - row.recordedTotal,
        suggestedAmount,
      };
    })
    .filter(
      (row) =>
        row.hours > 0 ||
        row.visits > 0 ||
        row.recordedTotal > 0 ||
        row.voidedTotal > 0
    )
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
};

export const getPayrollSummary = (
  rows: ReturnType<typeof buildPayrollRows>,
  payments: OpsEmployeePayment[]
) => {
  const paymentSummary = getPaymentSummary(payments);
  const suggestedTotal = rows.reduce(
    (sum, row) => sum + (row.suggestedAmount ?? 0),
    0
  );

  return {
    ...paymentSummary,
    balanceTotal: suggestedTotal - paymentSummary.recordedTotal,
    suggestedTotal,
  };
};
