import { toFinanceNumber } from "@/lib/ops/finance";
import type { OpsOperationalCost } from "@/components/ops/types";

export type CostBreakdownRow = {
  amount: number;
  color: string | null;
  name: string;
  share: number;
};

/**
 * Egresos by destination. Employee payments come in as one synthetic slice so
 * the rows add up to exactly summary.totalCosts, which is what makes this panel
 * reconcile with the hero card by construction.
 */
export const buildCostBreakdown = ({
  costs,
  employeePaymentsTotal,
}: {
  costs: OpsOperationalCost[];
  employeePaymentsTotal: number;
}): CostBreakdownRow[] => {
  const byCategory = new Map<string, { amount: number; color: string | null }>();

  costs.forEach((cost) => {
    if (cost.status !== "RECORDED") return;

    const name = cost.category?.name ?? "Sin categoria";
    const current = byCategory.get(name) ?? {
      amount: 0,
      color: cost.category?.color ?? null,
    };
    current.amount += toFinanceNumber(cost.amount);
    byCategory.set(name, current);
  });

  const rows = Array.from(byCategory, ([name, entry]) => ({
    amount: entry.amount,
    color: entry.color,
    name,
    share: 0,
  }));

  if (employeePaymentsTotal > 0) {
    rows.push({
      amount: employeePaymentsTotal,
      color: null,
      name: "Pagos a empleadas",
      share: 0,
    });
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return rows
    .map((row) => ({
      ...row,
      share: total ? (row.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};
