import {
  getAssignedMonthRange,
  getFinanceMonthKey,
} from "@/lib/ops/finance/month";
import { getFinancialSummary } from "@/lib/ops/finance/summary";

export type FinanceTrendAmounts = {
  employeePaymentsTotal: number;
  manualCostsTotal: number;
  realBpsTotal: number;
  recordedRevenue: number;
};

export type FinanceTrendBucket = {
  month: Date;
  monthKey: string;
  range: ReturnType<typeof getAssignedMonthRange>;
};

export type FinanceTrendPoint = FinanceTrendAmounts & {
  marginPercent: number;
  monthKey: string;
  realProfit: number;
  totalCosts: number;
};

const emptyAmounts: FinanceTrendAmounts = {
  employeePaymentsTotal: 0,
  manualCostsTotal: 0,
  realBpsTotal: 0,
  recordedRevenue: 0,
};

/** The window ending at `month`, oldest first. */
export const buildFinanceTrendMonths = (
  month: Date,
  months: number
): FinanceTrendBucket[] =>
  Array.from({ length: months }, (_, index) => {
    const bucketMonth = new Date(
      Date.UTC(
        month.getUTCFullYear(),
        month.getUTCMonth() + index - (months - 1),
        1
      )
    );

    return {
      month: bucketMonth,
      monthKey: getFinanceMonthKey(bucketMonth),
      range: getAssignedMonthRange(bucketMonth),
    };
  });

export const buildFinanceTrend = (
  buckets: FinanceTrendBucket[],
  amountsByMonthKey: Map<string, FinanceTrendAmounts>
): FinanceTrendPoint[] =>
  buckets.map((bucket) => {
    // A month with no rows is information, not noise: it is seeded with zeros
    // rather than filtered out.
    const amounts = amountsByMonthKey.get(bucket.monthKey) ?? emptyAmounts;
    // getFinancialSummary is the literal source of truth here, so a trend point
    // cannot drift from the month card. bpsEstimatePercent stays 0 on purpose:
    // the estimate depends on settings the client already holds, and computing
    // it here too would double-count it.
    const summary = getFinancialSummary({
      bpsEstimatePercent: 0,
      clientPayments: [
        { amount: amounts.recordedRevenue, status: "RECORDED" },
      ],
      employeePayments: [
        { amount: amounts.employeePaymentsTotal, status: "RECORDED" },
      ],
      operationalCosts: [
        {
          amount: amounts.manualCostsTotal - amounts.realBpsTotal,
          category: { kind: "GENERAL" },
          status: "RECORDED",
        },
        {
          amount: amounts.realBpsTotal,
          category: { kind: "BPS" },
          status: "RECORDED",
        },
      ],
    });

    return {
      employeePaymentsTotal: summary.employeePaymentsTotal,
      manualCostsTotal: summary.manualCostsTotal,
      marginPercent: summary.marginPercent,
      monthKey: bucket.monthKey,
      realBpsTotal: summary.realBpsTotal,
      realProfit: summary.realProfit,
      recordedRevenue: summary.recordedRevenue,
      totalCosts: summary.totalCosts,
    };
  });
