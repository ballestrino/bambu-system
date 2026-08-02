import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsJobListItem,
  OpsOperationalCost,
} from "@/components/ops/types";
import { getFinancialSummary } from "@/lib/ops/finance";
import { getJobBudgetPrice } from "@/lib/ops/job-budget-pricing";

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const toMoneyNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const getJobProjectedProfit = (job: OpsJobListItem) => {
  const snapshot = toRecord(job.budgetSnapshot);
  const snapshotOption = toRecord(snapshot?.option);
  const fallbackOption = toRecord(job.sourceBudgetOption);

  return toMoneyNumber(snapshotOption?.profit ?? fallbackOption?.profit);
};

export const formatDashboardMoney = (amount: number) =>
  moneyFormat.format(amount);

export const getDashboardFinancials = ({
  bpsEstimatePercent,
  clientPayments,
  employeePayments,
  jobs,
  operationalCosts,
}: {
  bpsEstimatePercent: number;
  clientPayments: OpsJobClientPayment[];
  employeePayments: OpsEmployeePayment[];
  jobs: OpsJobListItem[];
  operationalCosts: OpsOperationalCost[];
}) => {
  const projectedProfit = jobs.reduce(
    (total, job) => total + getJobProjectedProfit(job),
    0
  );
  const projectedRevenue = jobs.reduce(
    (total, job) =>
      total +
      (getJobBudgetPrice({
        budgetIncludesIva: job.budgetIncludesIva,
        budgetSnapshot: job.budgetSnapshot,
        sourceBudgetOption: job.sourceBudgetOption,
      }) ?? 0),
    0
  );
  const costsSummary = getFinancialSummary({
    bpsEstimatePercent,
    clientPayments,
    employeePayments,
    operationalCosts,
  });

  return {
    ...costsSummary,
    projectedProfit,
    projectedRevenue,
    recordedRevenue: costsSummary.recordedRevenue,
  };
};
