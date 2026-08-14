import {
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  Gift,
  ReceiptText,
  Undo2,
} from "lucide-react";

import { OpsMetricsGrid, type OpsMetric } from "@/components/ops/shared";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";

export const PayrollSummary = ({
  aguinaldoGeneratedTotal,
  balanceTotal,
  bpsGeneratedTotal,
  recordedTotal,
  showVoided = true,
  suggestedTotal,
  voidedTotal,
}: {
  aguinaldoGeneratedTotal: number;
  balanceTotal: number;
  bpsGeneratedTotal: number;
  recordedTotal: number;
  showVoided?: boolean;
  suggestedTotal: number;
  voidedTotal: number;
}) => {
  const metrics: OpsMetric[] = [
    {
      helper: "pago estimado del periodo",
      icon: BadgeDollarSign,
      label: "Sugerido",
      tone: "money",
      value: formatPayrollMoney(suggestedTotal),
    },
    {
      helper: "pagos confirmados",
      icon: ReceiptText,
      label: "Pagado",
      tone: "success",
      value: formatPayrollMoney(recordedTotal),
    },
    {
      helper: "pendiente por cubrir",
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

  return <OpsMetricsGrid metrics={metrics} />;
};
