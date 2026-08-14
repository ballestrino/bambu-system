import assert from "node:assert/strict";

import {
  getPayrollAccruals,
  getAssignedMonthRange,
  getEmployeePaymentDateFilter,
  getFinancialSummary,
  URUGUAY_EMPLOYER_BPS_PERCENT,
  URUGUAY_PERSONAL_BPS_BASE_PERCENT,
  URUGUAY_TOTAL_BPS_BASE_PERCENT,
} from "../lib/ops/finance";
import { toDateInputValue } from "../components/ops/utils";
import {
  buildPayrollRows,
  getPayrollSummary,
} from "../components/ops/payroll/payroll-utils";
import type { OpsEmployee, OpsOccurrence } from "../components/ops/types";
import { CreateEmployeePaymentSchema } from "../schemas/ops/employee-payment";

const recorded = (amount: number) => ({ amount, status: "RECORDED" });
const voided = (amount: number) => ({ amount, status: "VOIDED" });
const cost = (amount: number, kind = "GENERAL", status = "RECORDED") => ({
  amount,
  category: { kind },
  status,
});

const summary = getFinancialSummary({
  bpsEstimatePercent: 10,
  clientPayments: [recorded(1_000), voided(9_000)],
  employeePayments: [recorded(300), voided(700)],
  operationalCosts: [cost(100), cost(50, "BPS"), cost(500, "GENERAL", "VOIDED")],
});

assert.equal(summary.recordedRevenue, 1_000);
assert.equal(summary.employeePaymentsTotal, 300);
assert.equal(summary.manualCostsTotal, 150);
assert.equal(summary.totalCosts, 450);
assert.equal(summary.realProfit, 550);
assert.ok(Math.abs(summary.marginPercent - 55) < 0.000_001);
assert.equal(summary.realBpsTotal, 50);
assert.equal(summary.estimatedBpsTotal, 30);
assert.equal(summary.bpsDifference, 20);

assert.equal(URUGUAY_EMPLOYER_BPS_PERCENT, 12.625);
assert.equal(URUGUAY_PERSONAL_BPS_BASE_PERCENT, 18.1);
assert.equal(URUGUAY_TOTAL_BPS_BASE_PERCENT, 30.725);
const accruals = getPayrollAccruals(1_200);
assert.equal(accruals.aguinaldoGenerated, 100);
assert.equal(accruals.employerBpsGenerated, 151.5);
assert.ok(Math.abs((accruals.personalBpsGenerated ?? 0) - 217.2) < 0.000_001);
assert.ok(Math.abs((accruals.bpsGenerated ?? 0) - 368.7) < 0.000_001);
assert.deepEqual(getPayrollAccruals(null), {
  aguinaldoGenerated: null,
  bpsGenerated: null,
  employerBpsGenerated: null,
  personalBpsGenerated: null,
});

const employee = {
  hourlyRate: 100,
  id: "employee-1",
  name: "Ana",
} as unknown as OpsEmployee;
const occurrence = {
  actualEndAt: new Date("2026-08-03T12:00:00.000Z"),
  actualStartAt: new Date("2026-08-03T10:00:00.000Z"),
  employees: [{ employee, employeeId: employee.id }],
  status: "DONE",
} as unknown as OpsOccurrence;
const payrollRows = buildPayrollRows([employee], [occurrence], []);
assert.equal(payrollRows.length, 1);
assert.equal(payrollRows[0].suggestedAmount, 252);
assert.ok(Math.abs((payrollRows[0].aguinaldoGenerated ?? 0) - 200 / 12) < 0.000_001);
assert.equal(payrollRows[0].employerBpsGenerated, 25.25);
assert.ok(Math.abs((payrollRows[0].personalBpsGenerated ?? 0) - 36.2) < 0.000_001);
assert.ok(Math.abs((payrollRows[0].bpsGenerated ?? 0) - 61.45) < 0.000_001);
const payrollSummary = getPayrollSummary(payrollRows, []);
assert.equal(payrollSummary.suggestedTotal, 252);
assert.ok(Math.abs(payrollSummary.bpsGeneratedTotal - 61.45) < 0.000_001);
assert.ok(Math.abs(payrollSummary.aguinaldoGeneratedTotal - 200 / 12) < 0.000_001);

const empty = getFinancialSummary({
  bpsEstimatePercent: 20,
  clientPayments: [],
  employeePayments: [],
  operationalCosts: [],
});
assert.equal(empty.marginPercent, 0);
assert.equal(empty.realProfit, 0);

const negative = getFinancialSummary({
  bpsEstimatePercent: 0,
  clientPayments: [recorded(100)],
  employeePayments: [recorded(150)],
  operationalCosts: [cost(25)],
});
assert.equal(negative.realProfit, -75);
assert.equal(negative.marginPercent, -75);
assert.equal(
  toDateInputValue(new Date(2026, 7, 31, 23, 59, 59)),
  "2026-08-31"
);

const assignedMonth = new Date("2026-07-01T00:00:00.000Z");
const assignedFilter = getEmployeePaymentDateFilter({
  assignedMonth,
  basis: "PERIOD",
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2026-06-30T23:59:59.999Z"),
});
assert.deepEqual(assignedFilter, {
  assignedMonth: getAssignedMonthRange(assignedMonth),
});

const crossMonthPayment = {
  amount: 100,
  assignedMonth,
  employeeId: "c123456789012345678901234",
  paymentDate: new Date("2026-07-10T00:00:00.000Z"),
  periodEnd: new Date("2026-07-05T23:59:59.999Z"),
  periodStart: new Date("2026-06-20T00:00:00.000Z"),
  status: "RECORDED",
};
assert.equal(CreateEmployeePaymentSchema.safeParse(crossMonthPayment).success, true);
assert.equal(
  CreateEmployeePaymentSchema.safeParse({
    ...crossMonthPayment,
    assignedMonth: undefined,
  }).success,
  false
);

console.log("Finance checks passed");
