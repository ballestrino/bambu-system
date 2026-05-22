import { BanknoteArrowDown, CircleDollarSign, ReceiptText, Undo2 } from "lucide-react";

import { formatMoney } from "@/components/ops/payments/payment-utils";
import { OpsMetricsGrid, type OpsMetric } from "@/components/ops/shared";

export const PaymentsSummary = ({
  recordedCount,
  recordedTotal,
  showVoided = true,
  voidedCount,
  voidedTotal,
}: {
  recordedCount: number;
  recordedTotal: number;
  showVoided?: boolean;
  voidedCount: number;
  voidedTotal: number;
}) => {
  const metrics: OpsMetric[] = [
    {
      helper: "monto cobrado valido",
      icon: CircleDollarSign,
      label: "Cobrado registrado",
      tone: "money",
      value: formatMoney(recordedTotal),
    },
    {
      helper: "ingresos asentados",
      icon: ReceiptText,
      label: "Cobros registrados",
      tone: "active",
      value: recordedCount,
    },
  ];

  if (showVoided) {
    metrics.push(
      {
        helper: "historial sin impacto",
        icon: Undo2,
        label: "Anulado",
        tone: "archived",
        value: formatMoney(voidedTotal),
      },
      {
        helper: "cobros revertidos",
        icon: BanknoteArrowDown,
        label: "Cobros anulados",
        tone: "neutral",
        value: voidedCount,
      }
    );
  }

  return <OpsMetricsGrid metrics={metrics} />;
};
