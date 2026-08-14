export type ProfitabilitySeverity =
  | "HEALTHY"
  | "LOW_PROFIT"
  | "LOSS"
  | "CRITICAL_LOSS"
  | "INCOMPLETE"
  | "NO_ACTIVITY";

export type ProfitabilityMissingData =
  | "BUDGET_SNAPSHOT"
  | "EXPECTED_REVENUE"
  | "EXPECTED_PROFIT"
  | "PLANNED_VISITS"
  | "EMPLOYEE_RATE"
  | "REAL_TIMES"
  | "VISIT_TEAM";

export type ProfitabilityEmployeeSource = {
  hourlyRate: unknown;
  id: string;
  name: string;
};

export type ProfitabilityOccurrenceSource = {
  actualEndAt: Date | string | null;
  actualStartAt: Date | string | null;
  archivedAt?: Date | string | null;
  employees: ProfitabilityEmployeeSource[];
  id: string;
  status: string;
};

export type ProfitabilityAmountSource = {
  amount: unknown;
  status: string;
};

export type ProfitabilityJobSource = {
  budgetSnapshot: unknown;
  id: string;
  jobType: "ONGOING" | "PUNCTUAL";
  name: string;
  punctualEndDate?: Date | string | null;
  punctualStartDate?: Date | string | null;
  sourceBudgetOption?: unknown | null;
  status: string;
};

export type ProfitabilityCalculationInput = {
  clientPayments: ProfitabilityAmountSource[];
  isClosed: boolean;
  job: ProfitabilityJobSource;
  operationalCosts: ProfitabilityAmountSource[];
  occurrences: ProfitabilityOccurrenceSource[];
  periodEnd: Date | string;
  periodStart: Date | string;
  scope: "MONTH" | "HISTORY";
};

export type JobProfitability = {
  actualCost: number;
  actualProfit: number;
  collectedRevenue: number;
  completedVisits: number;
  expectedCost: number;
  expectedCostToDate: number;
  expectedProfit: number;
  expectedRevenue: number;
  jobId: string;
  jobName: string;
  laborCost: number;
  lossPercent: number;
  missingData: ProfitabilityMissingData[];
  operationalCost: number;
  periodEnd: string;
  periodStart: string;
  plannedVisits: number;
  profitShortfallPercent: number;
  progressPercent: number;
  scope: "MONTH" | "HISTORY";
  severity: ProfitabilitySeverity;
  transportationCost: number;
};

export type ProfitabilityQuery = {
  jobId?: string;
  mode: "MONTH" | "HISTORY";
  month: Date;
};
