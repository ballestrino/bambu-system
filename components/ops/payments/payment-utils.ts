import type {
  OpsJobClientPayment,
  OpsOccurrence,
} from "@/components/ops/types";
import {
  TRANSPORTATION_PAY_PER_VISIT,
  getCompletedVisitHours,
  getEmployeeHourlyRate,
  isCompletedEmployeeVisit,
} from "@/components/ops/compensation-utils";

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

export const toMoneyNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatMoney = (amount: number) => moneyFormat.format(amount);

export const getPaymentSummary = (payments: OpsJobClientPayment[]) =>
  payments.reduce(
    (acc, payment) => {
      const amount = toMoneyNumber(payment.amount);
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

type GeneratedPayRow = {
  amount: number | null;
  employeeId: string;
  employeeName: string;
  hourlyRate: number | null;
  hours: number;
  laborAmount: number;
  transportationAmount: number;
  visits: number;
};

export const buildEmployeeGeneratedPay = (occurrences: OpsOccurrence[]) => {
  const rows = new Map<string, GeneratedPayRow>();

  occurrences.forEach((occurrence) => {
    const employeeId = occurrence.employeeId;
    if (!isCompletedEmployeeVisit(occurrence) || !occurrence.employee || !employeeId) {
      return;
    }

    const current = rows.get(employeeId) ?? {
      amount: null,
      employeeId,
      employeeName: occurrence.employee.name,
      hourlyRate: getEmployeeHourlyRate(occurrence.employee),
      hours: 0,
      laborAmount: 0,
      transportationAmount: 0,
      visits: 0,
    };

    current.hours += getCompletedVisitHours(occurrence);
    current.transportationAmount += TRANSPORTATION_PAY_PER_VISIT;
    current.visits += 1;
    rows.set(current.employeeId, current);
  });

  return {
    rows: Array.from(rows.values())
      .map((row) => {
        if (row.hourlyRate === null) return row;

        const laborAmount = row.hours * row.hourlyRate;
        return {
          ...row,
          amount: laborAmount + row.transportationAmount,
          laborAmount,
        };
      })
      .sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1)),
  };
};
