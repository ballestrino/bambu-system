import {
  getMonthKey,
  getMonthRange,
  toDateInputValue,
} from "@/components/ops/utils";
import { getPayrollWorkMonth } from "@/lib/ops/finance";

const monthNameFormat = new Intl.DateTimeFormat("es-UY", { month: "long" });

// The standalone es-UY month is capitalized ("Agosto"); these names go
// mid-sentence.
const formatMonthName = (month: Date) =>
  monthNameFormat.format(month).toLocaleLowerCase("es-UY");

export type PayrollPeriod = ReturnType<typeof getPayrollPeriod>;

// The payroll screens show the payments assigned to the selected month against
// the hours of the month they settle, which is the previous one.
export const getPayrollPeriod = (paymentMonth: Date) => {
  const workMonth = getPayrollWorkMonth(paymentMonth);
  const range = getMonthRange(workMonth);

  return {
    endDate: toDateInputValue(range.end),
    paymentMonthName: formatMonthName(paymentMonth),
    range,
    startDate: toDateInputValue(range.start),
    workMonthKey: getMonthKey(workMonth),
    workMonthName: formatMonthName(workMonth),
  };
};

export const getPayrollPeriodDescription = (period: PayrollPeriod) =>
  `Sueldos a mes vencido: en ${period.paymentMonthName} se pagan las horas de ${period.workMonthName}.`;
