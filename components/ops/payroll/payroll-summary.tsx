import { BadgeDollarSign, CircleDollarSign, ReceiptText, Undo2 } from "lucide-react";

import { OpsMetricsGrid, type OpsMetric } from "@/components/ops/shared";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";

export const PayrollSummary = ({
  balanceTotal,
  recordedTotal,
  showVoided = true,
  suggestedTotal,
  voidedTotal,
}: {
  balanceTotal: number;
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
