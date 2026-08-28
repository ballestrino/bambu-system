import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsOperationalCost,
} from "@/components/ops/types";

export type FinancialReportSummary = {
  marginPercent: number;
  realProfit: number;
  recordedRevenue: number;
  totalCosts: number;
};

export type FinancialReportRow = {
  amount: number;
  date: Date;
  detail: string;
  id: string;
  secondary: string;
  status: "RECORDED" | "VOIDED";
};

const optionalDetail = (...values: Array<string | null | undefined>) =>
  values.map((value) => value?.trim()).filter(Boolean).join(" - ") || "Sin referencia ni notas";

const shortDate = new Intl.DateTimeFormat("es-UY", { dateStyle: "short" });

export const buildFinancialReportRows = ({
  clientPayments,
  costs,
  employeePayments,
}: {
  clientPayments: OpsJobClientPayment[];
  costs: OpsOperationalCost[];
  employeePayments: OpsEmployeePayment[];
}) => ({
  costs: costs.map((cost) => ({
    amount: Number(cost.amount),
    date: new Date(cost.costDate),
    detail: [cost.category.name, cost.job?.name, cost.employee?.name]
      .filter(Boolean)
      .join(" - "),
    id: cost.id,
    secondary: optionalDetail(cost.reference, cost.notes),
    status: cost.status,
  })) satisfies FinancialReportRow[],
  employeePayments: employeePayments.map((payment) => ({
    amount: Number(payment.amount),
    date: new Date(payment.paymentDate),
    detail: payment.employee.name,
    id: payment.id,
    secondary: `Período ${shortDate.format(new Date(payment.periodStart))} a ${shortDate.format(new Date(payment.periodEnd))} - ${optionalDetail(payment.reference, payment.notes)}`,
    status: payment.status,
  })) satisfies FinancialReportRow[],
  income: clientPayments.map((payment) => ({
    amount: Number(payment.amount),
    date: new Date(payment.paymentDate),
    detail: payment.job.name,
    id: payment.id,
    secondary: optionalDetail(payment.reference, payment.notes),
    status: payment.status,
  })) satisfies FinancialReportRow[],
});
