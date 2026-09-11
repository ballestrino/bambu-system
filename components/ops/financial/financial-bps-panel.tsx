"use client";

import { BadgeDollarSign, BanknoteArrowDown, Scale } from "lucide-react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import { OpsMetricCard, OpsSection } from "@/components/ops/shared";
import type { getFinancialSummary } from "@/lib/ops/finance";

export const FinancialBpsPanel = ({
  summary,
}: {
  summary: ReturnType<typeof getFinancialSummary>;
}) => (
  <OpsSection
    description="Real registrado contra el estimado sobre pagos a empleadas."
    title="BPS"
  >
    <div className="grid gap-3 sm:grid-cols-3">
      <OpsMetricCard
        helper="registrado como coste"
        icon={BadgeDollarSign}
        label="BPS real"
        size="compact"
        value={formatCostMoney(summary.realBpsTotal)}
      />
      <OpsMetricCard
        helper="sobre pagos a empleadas"
        icon={Scale}
        label="BPS estimado"
        size="compact"
        tone="active"
        value={formatCostMoney(summary.estimatedBpsTotal)}
      />
      <OpsMetricCard
        helper="real menos estimado"
        icon={BanknoteArrowDown}
        label="Diferencia"
        size="compact"
        tone={summary.bpsDifference > 0 ? "warning" : "success"}
        value={formatCostMoney(summary.bpsDifference)}
      />
    </div>
  </OpsSection>
);
