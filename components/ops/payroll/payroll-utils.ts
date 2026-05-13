import type {
  OpsEmployee,
  OpsEmployeePayment,
  OpsOccurrence,
} from "@/components/ops/types";

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

export const getEmployeeRate = (employee: Pick<OpsEmployee, "hourlyRate">) => {
  if (employee.hourlyRate === null || employee.hourlyRate === undefined) {
    return null;
  }

  const rate = Number(employee.hourlyRate);
  return Number.isFinite(rate) && rate >= 0 ? rate : null;
};

export const getPayrollHours = (occurrence: OpsOccurrence) => {
  if (occurrence.status !== "DONE" || !occurrence.employeeId || !occurrence.actualStartAt || !occurrence.actualEndAt) {
    return 0;
  }

  const startedAt = new Date(occurrence.actualStartAt).getTime();
  const endedAt = new Date(occurrence.actualEndAt).getTime();
  return Math.max(0, (endedAt - startedAt) / 3600000);
};

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
      voidedTotal: 0,
    };
    rows.set(employee.id, row);
    return row;
  };

  employees.forEach(ensureRow);
  occurrences.forEach((occurrence) => {
    if (!occurrence.employee) return;
    ensureRow(occurrence.employee).hours += getPayrollHours(occurrence);
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
        row.hourlyRate === null ? null : row.hours * row.hourlyRate;
      return {
        ...row,
        balance: suggestedAmount === null ? null : suggestedAmount - row.recordedTotal,
        suggestedAmount,
      };
    })
    .filter((row) => row.hours > 0 || row.recordedTotal > 0 || row.voidedTotal > 0)
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
