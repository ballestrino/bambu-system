import {
  AlertTriangle,
  BanknoteArrowDown,
  CircleSlash,
  TrendingDown,
} from "lucide-react";
import type { ComponentType } from "react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import { profitabilityNeedsAttention } from "@/components/ops/profitability/profitability-status";
import type { OpsTone } from "@/components/ops/shared";
import type { getFinancialSummary } from "@/lib/ops/finance";
import type { JobProfitability } from "@/lib/ops/profitability";

export type AttentionItem = {
  detail: string;
  icon: ComponentType<{ className?: string }>;
  id: string;
  section: FinanceSection;
  title: string;
  tone: OpsTone;
};

type VoidableRecord = { status: string };

export const countVoided = (...groups: VoidableRecord[][]) =>
  groups.reduce(
    (total, group) =>
      total + group.filter((record) => record.status === "VOIDED").length,
    0
  );

export const buildAttentionItems = ({
  summary,
  voidedCount,
}: {
  summary: ReturnType<typeof getFinancialSummary>;
  voidedCount: number;
}): AttentionItem[] => {
  const items: AttentionItem[] = [];

  if (summary.realProfit < 0) {
    items.push({
      detail: `El mes cierra en ${formatCostMoney(summary.realProfit)}.`,
      icon: TrendingDown,
      id: "resultado-negativo",
      section: "cobros",
      title: "Resultado negativo del mes",
      tone: "danger",
    });
  }

  if (summary.bpsDifference > 0) {
    items.push({
      detail: `Hay ${formatCostMoney(summary.bpsDifference)} de BPS registrado por encima del estimado.`,
      icon: BanknoteArrowDown,
      id: "bps-diferencia",
      section: "costes",
      title: "El BPS real supera al estimado",
      tone: "warning",
    });
  }

  if (voidedCount > 0) {
    items.push({
      detail: `${voidedCount} movimiento${voidedCount === 1 ? "" : "s"} quedan en el historial sin afectar los totales.`,
      icon: CircleSlash,
      id: "anulados",
      section: "cobros",
      title: `${voidedCount} registro${voidedCount === 1 ? "" : "s"} anulado${voidedCount === 1 ? "" : "s"}`,
      tone: "archived",
    });
  }

  return items;
};

export const buildProfitabilityItem = (
  results: JobProfitability[]
): AttentionItem | null => {
  const atRisk = results.filter((result) =>
    profitabilityNeedsAttention(result.severity)
  ).length;

  if (!atRisk) return null;

  return {
    detail: "Revisá horas, boletos y costes directos antes de que cierre el mes.",
    icon: AlertTriangle,
    id: "rentabilidad",
    section: "rentabilidad",
    title: `${atRisk} servicio${atRisk === 1 ? "" : "s"} con rentabilidad en riesgo`,
    tone: "warning",
  };
};
