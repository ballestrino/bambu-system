import { calculateEffectiveVisits } from "@/lib/budget-calculations";
import { getBudgetOptionPriceWithoutIva } from "@/lib/ops/job-budget-pricing";
import type {
  JobProfitability,
  ProfitabilityCalculationInput,
  ProfitabilityMissingData,
  ProfitabilitySeverity,
} from "@/lib/ops/profitability/types";

export const PROFIT_SHORTFALL_ALERT_PERCENT = 20;
export const CRITICAL_LOSS_PERCENT = 10;
export const PROFITABILITY_TRANSPORT_PER_EMPLOYEE_VISIT = 52;

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const money = (value: number) => Number(value.toFixed(2));
const percent = (value: number) => Number(value.toFixed(1));

const getOption = (input: ProfitabilityCalculationInput) => {
  const snapshot = toRecord(input.job.budgetSnapshot);
  return toRecord(snapshot?.option) ?? toRecord(input.job.sourceBudgetOption);
};

const getSeverity = ({
  actualProfit,
  expectedProfit,
  expectedRevenue,
  hasActivity,
  missingData,
}: {
  actualProfit: number;
  expectedProfit: number;
  expectedRevenue: number;
  hasActivity: boolean;
  missingData: ProfitabilityMissingData[];
}): ProfitabilitySeverity => {
  if (missingData.length) return "INCOMPLETE";
  if (!hasActivity) return "NO_ACTIVITY";
  if (actualProfit < 0) {
    if (expectedRevenue <= 0) return "CRITICAL_LOSS";
    const lossPercent = (Math.abs(actualProfit) / expectedRevenue) * 100;
    return lossPercent > CRITICAL_LOSS_PERCENT ? "CRITICAL_LOSS" : "LOSS";
  }
  if (actualProfit === 0) return "LOW_PROFIT";
  if (expectedProfit > 0) {
    const shortfall = ((expectedProfit - actualProfit) / expectedProfit) * 100;
    if (shortfall > PROFIT_SHORTFALL_ALERT_PERCENT) return "LOW_PROFIT";
  }
  return "HEALTHY";
};

export const calculateJobProfitability = (
  input: ProfitabilityCalculationInput
): JobProfitability => {
  const option = getOption(input);
  const missingData = new Set<ProfitabilityMissingData>();
  if (!option) missingData.add("BUDGET_SNAPSHOT");

  const expectedRevenue = getBudgetOptionPriceWithoutIva(option) ?? 0;
  const expectedProfitValue = toNumber(option?.profit);
  const rawVisits = toNumber(option?.visits) ?? 0;
  const visitType = typeof option?.visitType === "string" ? option.visitType : "days";
  const plannedVisits = calculateEffectiveVisits(rawVisits, visitType);
  if (expectedRevenue <= 0) missingData.add("EXPECTED_REVENUE");
  if (expectedProfitValue === null) missingData.add("EXPECTED_PROFIT");
  if (plannedVisits <= 0) missingData.add("PLANNED_VISITS");

  let laborCost = 0;
  let transportationCost = 0;
  let completedVisits = 0;
  input.occurrences.forEach((occurrence) => {
    if (occurrence.status !== "DONE" || occurrence.archivedAt) return;
    completedVisits += 1;
    if (!occurrence.actualStartAt || !occurrence.actualEndAt) {
      missingData.add("REAL_TIMES");
      return;
    }
    if (!occurrence.employees.length) {
      missingData.add("VISIT_TEAM");
      return;
    }
    const hours = Math.max(
      0,
      (new Date(occurrence.actualEndAt).getTime() -
        new Date(occurrence.actualStartAt).getTime()) /
        3_600_000
    );
    occurrence.employees.forEach((employee) => {
      transportationCost += PROFITABILITY_TRANSPORT_PER_EMPLOYEE_VISIT;
      const rate = toNumber(employee.hourlyRate);
      if (rate === null || rate < 0) {
        missingData.add("EMPLOYEE_RATE");
        return;
      }
      laborCost += hours * rate;
    });
  });

  const recordedTotal = (records: { amount: unknown; status: string }[]) =>
    records.reduce(
      (total, record) =>
        record.status === "RECORDED" ? total + (toNumber(record.amount) ?? 0) : total,
      0
    );
  const operationalCost = recordedTotal(input.operationalCosts);
  const collectedRevenue = recordedTotal(input.clientPayments);
  const actualCost = laborCost + transportationCost + operationalCost;
  const expectedProfit = expectedProfitValue ?? 0;
  const expectedCost = Math.max(0, expectedRevenue - expectedProfit);
  const progress = plannedVisits > 0 ? Math.min(completedVisits / plannedVisits, 1) : 0;
  const expectedCostToDate = expectedCost * progress;
  const actualProfit = input.isClosed
    ? expectedRevenue - actualCost
    : expectedProfit - (actualCost - expectedCostToDate);
  const hasActivity = completedVisits > 0 || actualCost > 0;
  const reportedProfit = hasActivity ? actualProfit : 0;
  const profitShortfall =
    !hasActivity
      ? 0
      :
    expectedProfit > 0
      ? Math.max(0, ((expectedProfit - actualProfit) / expectedProfit) * 100)
      : actualProfit <= 0
        ? 100
        : 0;
  const lossPercent =
    actualProfit < 0 && expectedRevenue > 0
      ? (Math.abs(actualProfit) / expectedRevenue) * 100
      : actualProfit < 0
        ? Number.POSITIVE_INFINITY
        : 0;
  const missing = Array.from(missingData);

  return {
    actualCost: money(actualCost),
    actualProfit: money(reportedProfit),
    collectedRevenue: money(collectedRevenue),
    completedVisits,
    expectedCost: money(expectedCost),
    expectedCostToDate: money(expectedCostToDate),
    expectedProfit: money(expectedProfit),
    expectedRevenue: money(expectedRevenue),
    jobId: input.job.id,
    jobName: input.job.name,
    laborCost: money(laborCost),
    lossPercent: Number.isFinite(lossPercent) ? percent(lossPercent) : 100,
    missingData: missing,
    operationalCost: money(operationalCost),
    periodEnd: new Date(input.periodEnd).toISOString(),
    periodStart: new Date(input.periodStart).toISOString(),
    plannedVisits: Number(plannedVisits.toFixed(2)),
    profitShortfallPercent: percent(profitShortfall),
    progressPercent: percent(progress * 100),
    scope: input.scope,
    severity: getSeverity({
      actualProfit,
      expectedProfit,
      expectedRevenue,
      hasActivity,
      missingData: missing,
    }),
    transportationCost: money(transportationCost),
  };
};
