import "server-only";

import { PaymentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { FinanceTrendQuerySchema } from "@/schemas/ops";
import {
  buildFinanceTrend,
  buildFinanceTrendMonths,
  getFinanceMonthKey,
  toFinanceNumber,
  type FinanceTrendAmounts,
} from "@/lib/ops/finance";

type AmountGroup = {
  assignedMonth: Date;
  _sum?: { amount?: unknown };
};

const emptyAmounts = (): FinanceTrendAmounts => ({
  employeePaymentsTotal: 0,
  manualCostsTotal: 0,
  realBpsTotal: 0,
  recordedRevenue: 0,
});

// A groupBy row is not guaranteed to land on a month start, so fold the groups
// into month buckets instead of trusting assignedMonth to be normalized.
const foldInto = (
  totals: Map<string, FinanceTrendAmounts>,
  groups: AmountGroup[],
  field: keyof FinanceTrendAmounts
) => {
  groups.forEach((group) => {
    const monthKey = getFinanceMonthKey(group.assignedMonth);
    const current = totals.get(monthKey) ?? emptyAmounts();
    current[field] += toFinanceNumber(group._sum?.amount);
    totals.set(monthKey, current);
  });
};

// The one aggregate read in data/: twelve numbers should not cost hundreds of
// rows over the wire. All three money tables index [status, assignedMonth],
// which is exactly this query's shape.
export const getFinanceTrend = async (query: unknown) => {
  try {
    await requireAdminSession();

    const parsedQuery = FinanceTrendQuerySchema.safeParse(query ?? {});
    if (!parsedQuery.success) {
      return { error: "Consulta de tendencia financiera invalida" };
    }

    const buckets = buildFinanceTrendMonths(
      parsedQuery.data.month,
      parsedQuery.data.months
    );
    // Identical predicate to getFinancialSummary: RECORDED only, selected by
    // assignedMonth inside getAssignedMonthRange. That is what makes the last
    // trend point reconcile exactly with the month card.
    const where = {
      assignedMonth: {
        gte: buckets[0].range.gte,
        lte: buckets[buckets.length - 1].range.lte,
      },
      status: PaymentStatus.RECORDED,
    };
    const [revenue, payroll, costs, bps] = await Promise.all([
      db.jobClientPayment.groupBy({
        by: ["assignedMonth"],
        _sum: { amount: true },
        where,
      }),
      db.employeePayment.groupBy({
        by: ["assignedMonth"],
        _sum: { amount: true },
        where,
      }),
      db.operationalCost.groupBy({
        by: ["assignedMonth"],
        _sum: { amount: true },
        where,
      }),
      db.operationalCost.groupBy({
        by: ["assignedMonth"],
        _sum: { amount: true },
        where: { ...where, category: { kind: "BPS" } },
      }),
    ]);

    const totals = new Map<string, FinanceTrendAmounts>();
    foldInto(totals, revenue, "recordedRevenue");
    foldInto(totals, payroll, "employeePaymentsTotal");
    foldInto(totals, costs, "manualCostsTotal");
    foldInto(totals, bps, "realBpsTotal");

    return { trend: buildFinanceTrend(buckets, totals) };
  } catch (error) {
    console.error("Error getting finance trend:", error);
    return { error: "Error al obtener la tendencia financiera" };
  }
};
