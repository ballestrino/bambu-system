import assert from "node:assert/strict";

import {
  costSearchFields,
  employeePaymentSearchFields,
  generatedPayInitialSort,
  generatedPaySortAccessors,
  paymentInitialSort,
  paymentSearchFields,
  paymentSortAccessors,
  payrollSortAccessors,
  sumRecordedAmounts,
  type GeneratedPayRow,
  type PayrollRow,
} from "../components/ops/financial/financial-table-queries";
import { toMoneyNumber } from "../components/ops/payments/payment-utils";
import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsOperationalCost,
} from "../components/ops/types";
import {
  compareSortValues,
  filterRowsBySearch,
  getNextSort,
  getTableViewSignature,
  paginateRows,
  resolvePageIndex,
  sortRows,
} from "../lib/ops/table-query";
import { matchesSearchText, normalizeSearchText } from "../lib/search-text";

// --- Search ignores accents, case and surrounding spaces, both ways.
assert.equal(normalizeSearchText("  Guaraní "), "guarani");
assert.ok(matchesSearchText("guarani", ["Guaraní"]));
assert.ok(matchesSearchText("GUARANÍ", ["guarani"]));
assert.ok(matchesSearchText("lopez", [null, undefined, "Casa López"]));
assert.equal(matchesSearchText("perez", ["Casa López", null]), false);
// An empty or blank query is "no search", not "match nothing".
assert.ok(matchesSearchText("", []));
assert.ok(matchesSearchText("   ", ["x"]));

const payment = (
  id: string,
  jobName: string,
  amount: number,
  paymentDate: string,
  extra: Partial<{ notes: string; reference: string; status: string }> = {}
) =>
  ({
    amount: String(amount),
    id,
    job: { name: jobName },
    jobId: `job-${id}`,
    notes: extra.notes ?? null,
    paymentDate,
    reference: extra.reference ?? null,
    status: extra.status ?? "RECORDED",
  }) as unknown as OpsJobClientPayment;

const payments = [
  payment("a", "Casa López", 12_900, "2026-09-05T00:00:00.000Z", { reference: "TR-114" }),
  payment("b", "Oficina Guaraní", 4_500.5, "2026-09-02T00:00:00.000Z", { notes: "Pago parcial" }),
  payment("c", "Casa 10", 800, "2026-09-09T00:00:00.000Z", { status: "VOIDED" }),
  payment("d", "Casa 2", 800, "2026-09-01T00:00:00.000Z"),
];
const findPayments = (query: string) =>
  filterRowsBySearch(payments, query, paymentSearchFields).map((row) => row.id);

// --- Cobros match on job, reference, notes and the amount in both spellings.
assert.deepEqual(findPayments("guarani"), ["b"]);
assert.deepEqual(findPayments("tr-114"), ["a"]);
assert.deepEqual(findPayments("parcial"), ["b"]);
assert.deepEqual(findPayments("12900"), ["a"]);
assert.deepEqual(findPayments("12.900"), ["a"]);
assert.deepEqual(findPayments("4500,5"), ["b"]);
assert.deepEqual(findPayments(""), ["a", "b", "c", "d"]);

// --- Default order is the latest payment first.
assert.deepEqual(
  sortRows(payments, paymentSortAccessors, paymentInitialSort).map((row) => row.id),
  ["c", "a", "b", "d"]
);
// Spanish collation with numeric runs: "Casa 2" before "Casa 10".
assert.deepEqual(
  sortRows(payments, paymentSortAccessors, { direction: "asc", key: "job" }).map(
    (row) => row.id
  ),
  ["d", "c", "a", "b"]
);
// Stable: the two 800 payments keep the order the server sent.
assert.deepEqual(
  sortRows(payments, paymentSortAccessors, { direction: "asc", key: "amount" }).map(
    (row) => row.id
  ),
  ["c", "d", "b", "a"]
);
assert.ok(compareSortValues("Nube", "Ñandú", "asc") < 0);
assert.ok(compareSortValues("Ñandú", "Oso", "asc") < 0);
assert.equal(compareSortValues("Álvarez", "alvarez", "asc"), 0);

// --- Missing values sort last in both directions.
assert.equal(compareSortValues(null, 5, "asc"), 1);
assert.equal(compareSortValues(null, 5, "desc"), 1);
assert.equal(compareSortValues(5, null, "desc"), -1);
assert.equal(compareSortValues(null, null, "asc"), 0);

const payrollRow = (employeeName: string, balance: number | null) =>
  ({ balance, employeeName, hours: 1, recordedTotal: 0, suggestedAmount: balance, visits: 1 }) as PayrollRow;
const payrollRows = [payrollRow("Ana", null), payrollRow("Bea", 300), payrollRow("Carla", -50)];
for (const direction of ["asc", "desc"] as const) {
  const sorted = sortRows(payrollRows, payrollSortAccessors, { direction, key: "balance" });
  assert.equal(sorted.at(-1)?.employeeName, "Ana", `null balance last (${direction})`);
}

const generatedRow = (employeeName: string, amount: number | null) =>
  ({ amount, employeeName, hours: 1, visits: 1 }) as GeneratedPayRow;
assert.deepEqual(
  sortRows(
    [generatedRow("Ana", null), generatedRow("Bea", 900), generatedRow("Carla", 1_200)],
    generatedPaySortAccessors,
    generatedPayInitialSort
  ).map((row) => row.employeeName),
  ["Carla", "Bea", "Ana"]
);

// --- Sort toggling: same column flips, a new one starts at its own default.
const toggle = (key: string, initial: "asc" | "desc") =>
  getNextSort({ direction: "desc", key: "date" }, key, initial);
assert.deepEqual(toggle("date", "desc"), { direction: "asc", key: "date" });
assert.deepEqual(toggle("amount", "desc"), { direction: "desc", key: "amount" });
assert.deepEqual(toggle("job", "asc"), { direction: "asc", key: "job" });

// --- Pagination clamps out-of-range pages and reports 1-based ranges.
const rows = Array.from({ length: 26 }, (_, index) => index);
assert.deepEqual(paginateRows(rows, 0, 25).pageRows.length, 25);
assert.deepEqual(paginateRows(rows, 1, 25), {
  pageCount: 2,
  pageIndex: 1,
  pageRows: [25],
  rangeEnd: 26,
  rangeStart: 26,
  total: 26,
});
assert.equal(paginateRows(rows, 9, 25).pageIndex, 1);
assert.equal(paginateRows(rows, -3, 25).pageIndex, 0);
assert.deepEqual(paginateRows([], 4, 25), {
  pageCount: 1,
  pageIndex: 0,
  pageRows: [],
  rangeEnd: 0,
  rangeStart: 0,
  total: 0,
});

// --- A stored page only survives under the view it was chosen in.
const byDate = { direction: "desc", key: "date" } as const;
const stored = { index: 2, signature: getTableViewSignature("casa", byDate, "RECORDED|ALL") };
assert.equal(resolvePageIndex(stored, getTableViewSignature(" casa ", byDate, "RECORDED|ALL")), 2);
assert.equal(resolvePageIndex(stored, getTableViewSignature("casa l", byDate, "RECORDED|ALL")), 0);
assert.equal(
  resolvePageIndex(stored, getTableViewSignature("casa", { ...byDate, direction: "asc" }, "RECORDED|ALL")),
  0
);
assert.equal(resolvePageIndex(stored, getTableViewSignature("casa", byDate, "ALL|ALL")), 0);

// --- Costs and employee payments search every relation they show.
const cost = {
  amount: "350",
  category: { name: "Taxi" },
  employee: { name: "Beatriz Núñez" },
  job: null,
  notes: null,
  reference: "Recibo 77",
  status: "RECORDED",
} as unknown as OpsOperationalCost;
assert.ok(matchesSearchText("nunez", costSearchFields(cost)));
assert.ok(matchesSearchText("taxi", costSearchFields(cost)));
assert.ok(matchesSearchText("recibo 77", costSearchFields(cost)));
assert.equal(matchesSearchText("casa", costSearchFields(cost)), false);

const employeePayment = {
  amount: "10000",
  employee: { name: "Ana Pérez" },
  notes: "Adelanto",
  reference: null,
} as unknown as OpsEmployeePayment;
assert.ok(matchesSearchText("ana perez", employeePaymentSearchFields(employeePayment)));
assert.ok(matchesSearchText("10.000", employeePaymentSearchFields(employeePayment)));

// --- Footer totals ignore voided records, like the section KPIs.
assert.equal(sumRecordedAmounts(payments, toMoneyNumber), 12_900 + 4_500.5 + 800);

console.log("Finance table checks passed");
