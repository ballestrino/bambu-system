import { BadgeDollarSign, CircleDollarSign, ReceiptText, Undo2 } from "lucide-react";

import { OpsMetricsGrid } from "@/components/ops/shared";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";

export const PayrollSummary = ({
  balanceTotal,
  recordedTotal,
  suggestedTotal,
  voidedTotal,
}: {
  balanceTotal: number;
  recordedTotal: number;
  suggestedTotal: number;
  voidedTotal: number;
}) => (
  <OpsMetricsGrid
    metrics={[
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
        helper: "historial sin impacto",
        icon: Undo2,
        label: "Anulado",
        tone: "archived",
        value: formatPayrollMoney(voidedTotal),
      },
    ]}
  />
);
