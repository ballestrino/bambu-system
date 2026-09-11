import {
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  Gift,
  Palmtree,
  ReceiptText,
  Undo2,
} from "lucide-react";

import { OpsMetricsGrid, type OpsMetric } from "@/components/ops/shared";
import type { PayrollPeriod } from "@/components/ops/payroll/payroll-period";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";

export const PayrollSummary = ({
  aguinaldoGeneratedTotal,
  balanceTotal,
  bpsGeneratedTotal,
  period,
  recordedTotal,
  showVoided = true,
  size,
  suggestedTotal,
  vacationSalaryGeneratedTotal,
  voidedTotal,
}: {
  aguinaldoGeneratedTotal: number;
  balanceTotal: number;
  bpsGeneratedTotal: number;
  period: PayrollPeriod;
  recordedTotal: number;
  showVoided?: boolean;
  size?: OpsMetric["size"];
  suggestedTotal: number;
  vacationSalaryGeneratedTotal: number;
  voidedTotal: number;
}) => {
  const metrics: OpsMetric[] = [
    {
      helper: `horas de ${period.workMonthName}`,
      icon: BadgeDollarSign,
      label: "Sugerido",
      tone: "money",
      value: formatPayrollMoney(suggestedTotal),
    },
    {
      helper: `pagado en ${period.paymentMonthName}`,
      icon: ReceiptText,
      label: "Pagado",
      tone: "success",
      value: formatPayrollMoney(recordedTotal),
    },
    {
      helper: `pendiente de ${period.workMonthName}`,
      icon: CircleDollarSign,
      label: "Saldo",
      tone: "warning",
      value: formatPayrollMoney(balanceTotal),
    },
    {
      helper: "1/12 del salario por horas",
      icon: Gift,
      label: "Aguinaldo generado",
      tone: "active",
      value: formatPayrollMoney(aguinaldoGeneratedTotal),
    },
    {
      helper: "1/12 de licencia menos 18,10% personal",
      icon: Palmtree,
      label: "Salario vacacional generado",
      tone: "active",
      value: formatPayrollMoney(vacationSalaryGeneratedTotal),
    },
    {
      helper: "30,725% base: 18,10% personal + 12,625% patronal",
      icon: Building2,
      label: "BPS generado base",
      tone: "neutral",
      value: formatPayrollMoney(bpsGeneratedTotal),
    },
  ];

  if (showVoided) {
    metrics.push(
      {
        helper: "historial sin impacto",
        icon: Undo2,
        label: "Anulado",
        tone: "archived",
        value: formatPayrollMoney(voidedTotal),
      }
    );
  }

  return (
    <OpsMetricsGrid metrics={metrics.map((metric) => ({ ...metric, size }))} />
  );
};
