import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsOperationalCost,
} from "@/components/ops/types";

const moneyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

export const toCostNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatCostMoney = (amount: number) => moneyFormat.format(amount);

export const getRecordedTotal = <
  T extends { amount: unknown; status: string },
>(
  records: T[]
) =>
  records.reduce(
    (total, record) =>
      record.status === "RECORDED" ? total + toCostNumber(record.amount) : total,
    0
  );

export const getCostsSummary = ({
  bpsEstimatePercent,
  clientPayments,
  employeePayments,
  operationalCosts,
}: {
  bpsEstimatePercent: number;
  clientPayments: OpsJobClientPayment[];
  employeePayments: OpsEmployeePayment[];
  operationalCosts: OpsOperationalCost[];
}) => {
  const recordedRevenue = getRecordedTotal(clientPayments);
  const employeePaymentsTotal = getRecordedTotal(employeePayments);
  const manualCostsTotal = getRecordedTotal(operationalCosts);
  const realBpsTotal = operationalCosts.reduce(
    (total, cost) =>
      cost.status === "RECORDED" && cost.category.kind === "BPS"
        ? total + toCostNumber(cost.amount)
        : total,
    0
  );
  const estimatedBpsTotal = employeePaymentsTotal * (bpsEstimatePercent / 100);
  const totalCosts = employeePaymentsTotal + manualCostsTotal;
  const realProfit = recordedRevenue - totalCosts;

  return {
    bpsDifference: realBpsTotal - estimatedBpsTotal,
    estimatedBpsTotal,
    employeePaymentsTotal,
    manualCostsTotal,
    marginPercent: recordedRevenue ? (realProfit / recordedRevenue) * 100 : 0,
    realBpsTotal,
    realProfit,
    recordedRevenue,
    totalCosts,
  };
};
