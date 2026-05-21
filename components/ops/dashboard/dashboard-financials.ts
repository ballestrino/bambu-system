import type {
  OpsJobClientPayment,
  OpsJobListItem,
} from "@/components/ops/types";
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

export const getDashboardFinancials = (
  jobs: OpsJobListItem[],
  payments: OpsJobClientPayment[]
) => ({
  projectedProfit: jobs.reduce(
    (total, job) => total + getJobProjectedProfit(job),
    0
  ),
  projectedRevenue: jobs.reduce(
    (total, job) =>
      total +
      (getJobBudgetPrice({
        budgetIncludesIva: job.budgetIncludesIva,
        budgetSnapshot: job.budgetSnapshot,
        sourceBudgetOption: job.sourceBudgetOption,
      }) ?? 0),
    0
  ),
  recordedRevenue: payments.reduce(
    (total, payment) => total + toMoneyNumber(payment.amount),
    0
  ),
});
