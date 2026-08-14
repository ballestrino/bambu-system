import { calculateJobProfitability } from "@/lib/ops/profitability/calculation";
import type {
  JobProfitability,
  ProfitabilityCalculationInput,
} from "@/lib/ops/profitability/types";

const severityRank: Record<JobProfitability["severity"], number> = {
  CRITICAL_LOSS: 0,
  LOSS: 1,
  LOW_PROFIT: 2,
  INCOMPLETE: 3,
  HEALTHY: 4,
  NO_ACTIVITY: 5,
};

export const sortProfitability = (rows: JobProfitability[]) =>
  [...rows].sort((left, right) => {
    const severityDifference =
      severityRank[left.severity] - severityRank[right.severity];
    if (severityDifference) return severityDifference;
    return left.actualProfit - right.actualProfit;
  });

export const aggregateProfitabilityHistory = (
  inputs: ProfitabilityCalculationInput[]
): JobProfitability | null => {
  const results = inputs
    .map(calculateJobProfitability)
    .filter((result) => result.severity !== "NO_ACTIVITY");
  if (!results.length) return null;

  const first = results[0];
  const sum = (key: keyof JobProfitability) =>
    results.reduce((total, result) => total + Number(result[key] ?? 0), 0);
  const expectedProfit = sum("expectedProfit");
  const actualProfit = sum("actualProfit");
  const expectedRevenue = sum("expectedRevenue");
  const missingData = Array.from(
    new Set(results.flatMap((result) => result.missingData))
  );
  const severity = missingData.length
    ? "INCOMPLETE"
    : actualProfit < 0
      ? Math.abs(actualProfit) / Math.max(expectedRevenue, 1) > 0.1
        ? "CRITICAL_LOSS"
        : "LOSS"
      : actualProfit === 0 ||
          (expectedProfit > 0 &&
            ((expectedProfit - actualProfit) / expectedProfit) * 100 > 20)
        ? "LOW_PROFIT"
        : "HEALTHY";

  return {
    ...first,
    actualCost: sum("actualCost"),
    actualProfit,
    collectedRevenue: sum("collectedRevenue"),
    completedVisits: sum("completedVisits"),
    expectedCost: sum("expectedCost"),
    expectedCostToDate: sum("expectedCostToDate"),
    expectedProfit,
    expectedRevenue,
    laborCost: sum("laborCost"),
    lossPercent:
      actualProfit < 0 ? (Math.abs(actualProfit) / Math.max(expectedRevenue, 1)) * 100 : 0,
    missingData,
    operationalCost: sum("operationalCost"),
    periodEnd: results.at(-1)?.periodEnd ?? first.periodEnd,
    periodStart: first.periodStart,
    plannedVisits: sum("plannedVisits"),
    profitShortfallPercent:
      expectedProfit > 0
        ? Math.max(0, ((expectedProfit - actualProfit) / expectedProfit) * 100)
        : actualProfit <= 0
          ? 100
          : 0,
    progressPercent:
      sum("plannedVisits") > 0
        ? Math.min(100, (sum("completedVisits") / sum("plannedVisits")) * 100)
        : 0,
    scope: "HISTORY",
    severity,
    transportationCost: sum("transportationCost"),
  };
};
