import assert from "node:assert/strict";

import {
  aggregateProfitabilityHistory,
  calculateJobProfitability,
  type ProfitabilityCalculationInput,
} from "../lib/ops/profitability";

const option = {
  iva: 22,
  price: 1220,
  profit: 200,
  visitType: "month",
  visits: 4,
};

const occurrence = (id: string, hourlyRate: number | null = 0) => ({
  actualEndAt: "2026-08-03T11:00:00.000Z",
  actualStartAt: "2026-08-03T10:00:00.000Z",
  employees: [{ hourlyRate, id: `employee-${id}`, name: `Empleado ${id}` }],
  id,
  status: "DONE",
});

const input = ({
  closed = false,
  cost = 296,
  occurrences = [occurrence("1"), occurrence("2")],
  paymentStatus = "RECORDED",
  snapshotOption = option,
}: {
  closed?: boolean;
  cost?: number;
  occurrences?: ProfitabilityCalculationInput["occurrences"];
  paymentStatus?: string;
  snapshotOption?: Record<string, unknown> | null;
} = {}): ProfitabilityCalculationInput => ({
  clientPayments: [{ amount: 500, status: paymentStatus }],
  isClosed: closed,
  job: {
    budgetSnapshot: snapshotOption ? { option: snapshotOption } : null,
    id: "job-1",
    jobType: "ONGOING",
    name: "Servicio de prueba",
    status: "ACTIVE",
  },
  operationalCosts: [{ amount: cost, status: "RECORDED" }],
  occurrences,
  periodEnd: "2026-08-31T23:59:59.999Z",
  periodStart: "2026-08-01T00:00:00.000Z",
  scope: "MONTH",
});

const healthy = calculateJobProfitability(input());
assert.equal(healthy.expectedRevenue, 1000, "elimina IVA del ingreso esperado");
assert.equal(healthy.actualCost, 400, "suma horas, boletos y costes directos");
assert.equal(healthy.actualProfit, 200, "mantiene el objetivo al respetar el coste esperado");
assert.equal(healthy.severity, "HEALTHY");
assert.equal(healthy.collectedRevenue, 500, "informa cobros sin usarlos en el resultado");

const exactTwenty = calculateJobProfitability(input({ cost: 336 }));
assert.equal(exactTwenty.actualProfit, 160);
assert.equal(exactTwenty.profitShortfallPercent, 20);
assert.equal(exactTwenty.severity, "HEALTHY", "20% exacto no alerta");

const overTwenty = calculateJobProfitability(input({ cost: 337 }));
assert.equal(overTwenty.severity, "LOW_PROFIT", "más de 20% alerta");

const zeroProfit = calculateJobProfitability(input({ cost: 496 }));
assert.equal(zeroProfit.actualProfit, 0);
assert.equal(zeroProfit.severity, "LOW_PROFIT");

const lossBoundary = calculateJobProfitability(input({ cost: 596 }));
assert.equal(lossBoundary.actualProfit, -100);
assert.equal(lossBoundary.lossPercent, 10);
assert.equal(lossBoundary.severity, "LOSS", "10% exacto es pérdida no crítica");

const critical = calculateJobProfitability(input({ cost: 597 }));
assert.equal(critical.severity, "CRITICAL_LOSS", "más de 10% es crítico");

const closed = calculateJobProfitability(input({ closed: true, cost: 996 }));
assert.equal(closed.actualCost, 1100);
assert.equal(closed.actualProfit, -100, "un período cerrado usa ingreso menos costes");

const voidedPayment = calculateJobProfitability(input({ paymentStatus: "VOIDED" }));
assert.equal(voidedPayment.collectedRevenue, 0, "ignora cobros anulados");

const missingRate = calculateJobProfitability(
  input({ occurrences: [occurrence("missing", null)] })
);
assert.equal(missingRate.severity, "INCOMPLETE");
assert.ok(missingRate.missingData.includes("EMPLOYEE_RATE"));

const extraVisits = calculateJobProfitability(
  input({ occurrences: [1, 2, 3, 4, 5].map((value) => occurrence(String(value))) })
);
assert.equal(extraVisits.progressPercent, 100, "el progreso se limita al 100%");
assert.equal(extraVisits.transportationCost, 260, "los costes extra no se limitan");

const incompleteBudget = calculateJobProfitability(input({ snapshotOption: null }));
assert.equal(incompleteBudget.severity, "INCOMPLETE");
assert.ok(incompleteBudget.missingData.includes("BUDGET_SNAPSHOT"));

const noActivity = calculateJobProfitability(
  input({ cost: 0, occurrences: [], paymentStatus: "VOIDED" })
);
assert.equal(noActivity.severity, "NO_ACTIVITY");

const september = input({ closed: true, cost: 196 });
september.periodStart = "2026-09-01T00:00:00.000Z";
september.periodEnd = "2026-09-30T23:59:59.999Z";
september.scope = "HISTORY";
const history = aggregateProfitabilityHistory([
  { ...input({ closed: true }), scope: "HISTORY" },
  september,
]);
assert.ok(history);
assert.equal(history?.scope, "HISTORY");
assert.equal(history?.expectedProfit, 400);
assert.equal(history?.actualProfit, 1300, "suma resultados de meses con actividad");

console.log("Profitability checks passed");
