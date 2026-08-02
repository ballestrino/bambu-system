type AmountRecord = {
  amount: unknown;
  status: string;
};

type CostRecord = AmountRecord & {
  category: {
    kind: string;
  };
};

export const toFinanceNumber = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const getRecordedFinanceTotal = <T extends AmountRecord>(records: T[]) =>
  records.reduce(
    (total, record) =>
      record.status === "RECORDED"
        ? total + toFinanceNumber(record.amount)
        : total,
    0
  );

export const getFinancialSummary = ({
  bpsEstimatePercent,
  clientPayments,
  employeePayments,
  operationalCosts,
}: {
  bpsEstimatePercent: number;
  clientPayments: AmountRecord[];
  employeePayments: AmountRecord[];
  operationalCosts: CostRecord[];
}) => {
  const recordedRevenue = getRecordedFinanceTotal(clientPayments);
  const employeePaymentsTotal = getRecordedFinanceTotal(employeePayments);
  const manualCostsTotal = getRecordedFinanceTotal(operationalCosts);
  const realBpsTotal = operationalCosts.reduce(
    (total, cost) =>
      cost.status === "RECORDED" && cost.category.kind === "BPS"
        ? total + toFinanceNumber(cost.amount)
        : total,
    0
  );
  const estimatedBpsTotal = employeePaymentsTotal * (bpsEstimatePercent / 100);
  const totalCosts = employeePaymentsTotal + manualCostsTotal;
  const realProfit = recordedRevenue - totalCosts;

  return {
    bpsDifference: realBpsTotal - estimatedBpsTotal,
    employeePaymentsTotal,
    estimatedBpsTotal,
    manualCostsTotal,
    marginPercent: recordedRevenue ? (realProfit / recordedRevenue) * 100 : 0,
    realBpsTotal,
    realProfit,
    recordedRevenue,
    totalCosts,
  };
};
