import assert from "node:assert/strict";

import {
  buildEmployeeAccrualRows,
  getAguinaldoPeriodRange,
  getEmployeeAccrualTotals,
  getInitialEmployeeAccrualsRange,
  getYearRange,
} from "../components/ops/employees/employee-accruals-utils";
import type { OpsEmployee, OpsOccurrence } from "../components/ops/types";
import { toDateInputValue } from "../components/ops/utils";

const asDateInput = (range: { end: Date; start: Date }) => [
  toDateInputValue(range.start),
  toDateInputValue(range.end),
];

assert.deepEqual(asDateInput(getYearRange(new Date(2026, 8, 8))), [
  "2026-01-01",
  "2026-12-31",
]);

// Septiembre cae en el semestre que se paga en diciembre.
assert.deepEqual(asDateInput(getAguinaldoPeriodRange(new Date(2026, 8, 8))), [
  "2026-06-01",
  "2026-11-30",
]);
// Diciembre abre el semestre que se paga en junio del año siguiente.
assert.deepEqual(asDateInput(getAguinaldoPeriodRange(new Date(2026, 11, 15))), [
  "2026-12-01",
  "2027-05-31",
]);
// Enero sigue dentro del semestre abierto en diciembre.
assert.deepEqual(asDateInput(getAguinaldoPeriodRange(new Date(2026, 0, 20))), [
  "2025-12-01",
  "2026-05-31",
]);

assert.deepEqual(getInitialEmployeeAccrualsRange("2026-03-01", "2026-03-31"), {
  endDate: "2026-03-31",
  startDate: "2026-03-01",
});
const fallbackRange = getInitialEmployeeAccrualsRange("no-es-fecha", undefined);
const currentYear = getYearRange(new Date());
assert.deepEqual(fallbackRange, {
  endDate: toDateInputValue(currentYear.end),
  startDate: toDateInputValue(currentYear.start),
});

const withRate = {
  hourlyRate: 100,
  id: "employee-1",
  name: "Ana",
} as unknown as OpsEmployee;
const withoutRate = {
  hourlyRate: null,
  id: "employee-2",
  name: "Beatriz",
} as unknown as OpsEmployee;
const idle = {
  hourlyRate: 200,
  id: "employee-3",
  name: "Carla",
} as unknown as OpsEmployee;

const visitFor = (employee: OpsEmployee, hours: number) =>
  ({
    actualEndAt: new Date(2026, 7, 3, 10 + hours, 0, 0),
    actualStartAt: new Date(2026, 7, 3, 10, 0, 0),
    employees: [{ employee, employeeId: employee.id }],
    status: "DONE",
  }) as unknown as OpsOccurrence;

const rows = buildEmployeeAccrualRows(
  [withRate, withoutRate, idle],
  [visitFor(withRate, 2), visitFor(withoutRate, 3)]
);

// Las empleadas sin horas ni pagos quedan fuera de la lista.
assert.deepEqual(
  rows.map((row) => row.employeeName),
  ["Ana", "Beatriz"]
);

const [ana, beatriz] = rows;
assert.equal(ana.hours, 2);
assert.equal(ana.laborAmount, 200);
assert.ok(Math.abs((ana.aguinaldoGenerated ?? 0) - 200 / 12) < 0.000_001);
assert.ok(
  Math.abs((ana.vacationSalaryGenerated ?? 0) - (200 / 12) * 0.819) < 0.000_001
);
assert.ok(
  Math.abs((ana.totalGenerated ?? 0) - (200 / 12) * 1.819) < 0.000_001
);

// Sin tarifa horaria no hay devengado que mostrar, pero la fila sigue visible.
assert.equal(beatriz.hours, 3);
assert.equal(beatriz.hourlyRate, null);
assert.equal(beatriz.aguinaldoGenerated, null);
assert.equal(beatriz.vacationSalaryGenerated, null);
assert.equal(beatriz.totalGenerated, null);

const totals = getEmployeeAccrualTotals(rows);
assert.equal(totals.employeesWithoutRate, 1);
assert.equal(totals.hoursTotal, 5);
assert.ok(Math.abs(totals.aguinaldoTotal - 200 / 12) < 0.000_001);
assert.ok(Math.abs(totals.vacationSalaryTotal - (200 / 12) * 0.819) < 0.000_001);
assert.ok(
  Math.abs(
    totals.grandTotal - (totals.aguinaldoTotal + totals.vacationSalaryTotal)
  ) < 0.000_001
);

const emptyTotals = getEmployeeAccrualTotals([]);
assert.equal(emptyTotals.grandTotal, 0);
assert.equal(emptyTotals.employeesWithoutRate, 0);
assert.equal(emptyTotals.hoursTotal, 0);

console.log("Employee accruals checks passed");
