"use client";

import { ArrowRight, UsersRound } from "lucide-react";

import { formatCostMoney } from "@/components/ops/costs/cost-utils";
import type { FinanceSection } from "@/components/ops/financial/financial-sections";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { buildEmployeeGeneratedPay } from "@/components/ops/payments/payment-utils";
import { OpsEmptyState, OpsSection } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Plain CSS bars, not recharts: this is a ranked list of single values, it reads
// better at 390px and it keeps recharts to the two panels that need it.
export const FinancialTeamRevenuePanel = ({
  onSelectSection,
  workspace,
}: {
  onSelectSection: (section: FinanceSection) => void;
  workspace: FinancialWorkspace;
}) => {
  const rows = buildEmployeeGeneratedPay(workspace.occurrences).rows.slice(0, 5);
  const top = rows[0]?.amount ?? 0;

  return (
    <OpsSection
      actions={
        rows.length ? (
          <Button
            onClick={() => onSelectSection("cobros")}
            size="sm"
            type="button"
            variant="outline"
          >
            Ver todo
            <ArrowRight />
          </Button>
        ) : undefined
      }
      description="Pago generado por horas y boletos de las visitas realizadas."
      title="Generado por el equipo"
    >
      {workspace.loading.payroll ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <OpsEmptyState
          description="Cuando se marquen visitas como realizadas vas a ver acá cuánto generó cada empleada."
          icon={UsersRound}
          title="Sin visitas realizadas este mes"
        />
      ) : (
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li className="grid gap-1.5" key={row.employeeId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ops-text">
                  {row.employeeName}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-ops-text">
                  {row.amount === null ? "Sin tarifa" : formatCostMoney(row.amount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ops-surface-muted">
                <div
                  className="h-full rounded-full bg-ops-bamboo"
                  style={{
                    width: `${top > 0 && row.amount ? Math.max((row.amount / top) * 100, 4) : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-ops-text-muted">
                {row.hours.toFixed(2)} hs · {row.visits} visitas
              </p>
            </li>
          ))}
        </ul>
      )}
    </OpsSection>
  );
};
