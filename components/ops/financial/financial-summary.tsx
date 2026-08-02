import {
  BadgeDollarSign,
  BanknoteArrowDown,
  CircleDollarSign,
  HandCoins,
  Percent,
  ReceiptText,
  Scale,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import { OpsMetricsGrid, OpsRecordSkeleton } from "@/components/ops/shared";
import type { getFinancialSummary } from "@/lib/ops/finance";

type Summary = ReturnType<typeof getFinancialSummary>;

export const FinancialSummary = ({
  error,
  isLoading,
  onRetry,
  summary,
}: {
  error: unknown;
  isLoading: boolean;
  onRetry: () => Promise<unknown> | void;
  summary: Summary;
}) => {
  if (error) return <FinancialErrorState onRetry={onRetry} />;
  if (isLoading) return <OpsRecordSkeleton count={3} />;

  return (
    <OpsMetricsGrid
      metrics={[
        { helper: "cobros asignados", icon: CircleDollarSign, label: "Cobrado", tone: "money", value: formatCostMoney(summary.recordedRevenue) },
        { helper: "costes operativos", icon: ReceiptText, label: "Costes", tone: "warning", value: formatCostMoney(summary.manualCostsTotal) },
        { helper: "pagos confirmados", icon: HandCoins, label: "Empleadas", tone: "warning", value: formatCostMoney(summary.employeePaymentsTotal) },
        { helper: "costes + empleadas", icon: WalletCards, label: "Egresos", tone: "archived", value: formatCostMoney(summary.totalCosts) },
        { helper: "cobrado menos egresos", icon: TrendingUp, label: "Resultado", tone: summary.realProfit >= 0 ? "success" : "danger", value: formatCostMoney(summary.realProfit) },
        { helper: "resultado sobre cobrado", icon: Percent, label: "Margen", tone: summary.marginPercent >= 0 ? "success" : "danger", value: `${summary.marginPercent.toFixed(1)}%` },
        { helper: "BPS registrado", icon: BadgeDollarSign, label: "BPS real", tone: "neutral", value: formatCostMoney(summary.realBpsTotal) },
        { helper: "sobre pagos a empleadas", icon: Scale, label: "BPS estimado", tone: "active", value: formatCostMoney(summary.estimatedBpsTotal) },
        { helper: "real menos estimado", icon: BanknoteArrowDown, label: "Diferencia BPS", tone: summary.bpsDifference >= 0 ? "warning" : "success", value: formatCostMoney(summary.bpsDifference) },
      ]}
    />
  );
};
