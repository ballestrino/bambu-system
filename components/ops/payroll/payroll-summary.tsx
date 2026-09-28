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
import { PAYROLL_TRACKING_START_LABEL } from "@/lib/ops/finance";

const UNTRACKED_VALUE = "Sin registro";
const UNTRACKED_HELPER = `se registra desde ${PAYROLL_TRACKING_START_LABEL}`;

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
      helper: period.isTracked ? `horas de ${period.workMonthName}` : UNTRACKED_HELPER,
      icon: BadgeDollarSign,
      label: "Sugerido",
      tone: period.isTracked ? "money" : "archived",
      value: period.isTracked ? formatPayrollMoney(suggestedTotal) : UNTRACKED_VALUE,
    },
    {
      helper: `pagado en ${period.paymentMonthName}`,
      icon: ReceiptText,
      label: "Pagado",
      tone: "success",
      value: formatPayrollMoney(recordedTotal),
    },
    {
      helper: period.isTracked ? `pendiente de ${period.workMonthName}` : UNTRACKED_HELPER,
      icon: CircleDollarSign,
      label: "Saldo",
      tone: period.isTracked ? "warning" : "archived",
      value: period.isTracked ? formatPayrollMoney(balanceTotal) : UNTRACKED_VALUE,
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
