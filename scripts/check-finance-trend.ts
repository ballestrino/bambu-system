import assert from "node:assert/strict";

import {
  buildFinanceTrend,
  buildFinanceTrendMonths,
  getAssignedMonthRange,
  getFinanceMonthKey,
  getFinancialSummary,
  type FinanceTrendAmounts,
} from "../lib/ops/finance";

const september = new Date(Date.UTC(2026, 8, 1));
const buckets = buildFinanceTrendMonths(september, 3);

// --- The window is the last three months, oldest first, never filtered.
assert.deepEqual(
  buckets.map((bucket) => bucket.monthKey),
  ["2026-07", "2026-08", "2026-09"]
);

// --- The trend predicate must be byte-identical to the month card's, or the
// last point stops reconciling with it.
assert.deepEqual(buckets[0].range, getAssignedMonthRange(new Date(Date.UTC(2026, 6, 1))));
assert.deepEqual(buckets[2].range, getAssignedMonthRange(september));

// --- UTC bucketing. getMonthKey would return "2026-08" for this instant under
// TZ=America/Montevideo, misfiling every month boundary.
assert.equal(
  getFinanceMonthKey(new Date("2026-09-01T00:00:00.000Z")),
  "2026-09"
);

const amounts: FinanceTrendAmounts = {
  employeePaymentsTotal: 300,
  manualCostsTotal: 150,
  realBpsTotal: 50,
  recordedRevenue: 1_000,
};
const trend = buildFinanceTrend(
  buckets,
  new Map([["2026-09", amounts]])
);

// --- Months without rows stay in the series as zeros.
assert.equal(trend.length, 3);
["2026-07", "2026-08"].forEach((monthKey) => {
  const point = trend.find((item) => item.monthKey === monthKey);
  assert.ok(point);
  assert.equal(point.recordedRevenue, 0);
  assert.equal(point.totalCosts, 0);
  assert.equal(point.realProfit, 0);
  assert.equal(point.marginPercent, 0);
});

// --- Reconciliation: the last point equals getFinancialSummary over the same
// records. VOIDED rows never reach the trend because the query filters them in
// SQL, so the equivalent fixture here carries only RECORDED amounts.
const recorded = (amount: number) => ({ amount, status: "RECORDED" });
const monthSummary = getFinancialSummary({
  bpsEstimatePercent: 0,
  clientPayments: [recorded(1_000)],
  employeePayments: [recorded(300)],
  operationalCosts: [
    { amount: 100, category: { kind: "GENERAL" }, status: "RECORDED" },
    { amount: 50, category: { kind: "BPS" }, status: "RECORDED" },
  ],
});
const lastPoint = trend[trend.length - 1];
(
  [
    "recordedRevenue",
    "employeePaymentsTotal",
    "manualCostsTotal",
    "totalCosts",
    "realProfit",
    "marginPercent",
    "realBpsTotal",
  ] as const
).forEach((field) => {
  assert.ok(
    Math.abs(lastPoint[field] - monthSummary[field]) < 1e-9,
    `${field}: ${lastPoint[field]} != ${monthSummary[field]}`
  );
});

// --- The BPS slice is carved out of the manual costs, not added on top.
assert.equal(lastPoint.manualCostsTotal, 150);
assert.equal(lastPoint.realBpsTotal, 50);

// --- Negative result, and the zero-revenue guard branch.
const [lossPoint] = buildFinanceTrend(
  buildFinanceTrendMonths(september, 1),
  new Map([
    [
      "2026-09",
      { ...amounts, employeePaymentsTotal: 2_000 } satisfies FinanceTrendAmounts,
    ],
  ])
);
assert.equal(lossPoint.realProfit, 1_000 - 2_150);
assert.ok(lossPoint.marginPercent < 0);

const [emptyPoint] = buildFinanceTrend(buildFinanceTrendMonths(september, 1), new Map());
assert.equal(emptyPoint.marginPercent, 0);

console.log("Finance trend checks passed");
