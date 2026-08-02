import {
  getFinancialSummary,
  getRecordedFinanceTotal,
  toFinanceNumber,
} from "@/lib/ops/finance";

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

export const toCostNumber = toFinanceNumber;

export const formatCostMoney = (amount: number) => moneyFormat.format(amount);

export const getRecordedTotal = getRecordedFinanceTotal;
export const getCostsSummary = getFinancialSummary;
