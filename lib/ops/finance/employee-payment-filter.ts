import { getAssignedMonthRange } from "@/lib/ops/finance/month";

type EmployeePaymentDateFilterInput = {
  assignedMonth?: Date;
  basis?: "PAYMENT_DATE" | "PERIOD";
  endDate?: Date;
  startDate?: Date;
};

const getDateRange = (startDate?: Date, endDate?: Date) =>
  startDate || endDate
    ? {
        gte: startDate,
        lte: endDate,
      }
    : undefined;

export const getEmployeePaymentDateFilter = ({
  assignedMonth,
  basis,
  endDate,
  startDate,
}: EmployeePaymentDateFilterInput) => {
  if (assignedMonth) {
    return { assignedMonth: getAssignedMonthRange(assignedMonth) };
  }

  if (basis === "PAYMENT_DATE") {
    return { paymentDate: getDateRange(startDate, endDate) };
  }

  return {
    AND:
      startDate || endDate
        ? [
            endDate ? { periodStart: { lte: endDate } } : {},
            startDate ? { periodEnd: { gte: startDate } } : {},
          ]
        : undefined,
  };
};
