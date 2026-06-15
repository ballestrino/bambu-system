import {
  BadgeDollarSign,
  BanknoteArrowDown,
  CircleDollarSign,
  HandCoins,
  Percent,
  ReceiptText,
  Scale,
  TrendingUp,
} from "lucide-react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import { OpsMetricsGrid } from "@/components/ops/shared";

export const CostsSummary = ({
  bpsDifference,
  employeePaymentsTotal,
  estimatedBpsTotal,
  marginPercent,
  realBpsTotal,
  realProfit,
  recordedRevenue,
  totalCosts,
}: {
  bpsDifference: number;
  employeePaymentsTotal: number;
  estimatedBpsTotal: number;
  marginPercent: number;
  realBpsTotal: number;
  realProfit: number;
  recordedRevenue: number;
  totalCosts: number;
}) => (
  <OpsMetricsGrid
    metrics={[
      {
        helper: "cobros asignados al periodo",
        icon: CircleDollarSign,
        label: "Cobrado",
        tone: "money",
        value: formatCostMoney(recordedRevenue),
      },
      {
        helper: "pagos del periodo trabajado",
        icon: HandCoins,
        label: "Empleadas",
        tone: "warning",
        value: formatCostMoney(employeePaymentsTotal),
      },
      {
        helper: "empleadas + costes registrados",
        icon: ReceiptText,
        label: "Costes totales",
        tone: "archived",
        value: formatCostMoney(totalCosts),
      },
      {
        helper: "resultado real del periodo",
        icon: TrendingUp,
        label: "Ganancia",
        tone: realProfit >= 0 ? "success" : "danger",
        value: formatCostMoney(realProfit),
      },
      {
        helper: "BPS cargado manualmente",
        icon: BadgeDollarSign,
        label: "BPS real",
        tone: "neutral",
        value: formatCostMoney(realBpsTotal),
      },
      {
        helper: "sobre pagos a empleadas",
        icon: Scale,
        label: "BPS estimado",
        tone: "active",
        value: formatCostMoney(estimatedBpsTotal),
      },
      {
        helper: "real menos estimado",
        icon: BanknoteArrowDown,
        label: "Diferencia BPS",
        tone: bpsDifference >= 0 ? "warning" : "success",
        value: formatCostMoney(bpsDifference),
      },
      {
        helper: "ganancia sobre cobrado",
        icon: Percent,
        label: "Margen",
        tone: marginPercent >= 0 ? "success" : "danger",
        value: `${marginPercent.toFixed(1)}%`,
      },
    ]}
  />
);
