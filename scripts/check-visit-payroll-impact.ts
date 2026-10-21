import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getCompletedVisitHours } from "../components/ops/compensation-utils";
import type { OpsOccurrence } from "../components/ops/types";
import {
  formatVisitPayrollWarning,
  getVisitPayrollImpact,
} from "../components/ops/visit-payroll-impact";

// Removing a done visit takes its hours and transport off payroll in the
// month it was scheduled (Montevideo, UTC-3). CRLF normalizado.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const employee = (id: string, name: string) => ({ employee: { id, name } });
const visit = (overrides: Partial<Record<keyof OpsOccurrence, unknown>> = {}) =>
  ({
    actualEndAt: new Date("2026-10-14T16:30:00.000Z"),
    actualStartAt: new Date("2026-10-14T12:00:00.000Z"),
    employees: [employee("ana", "Ana"), employee("bea", "Bea")],
    scheduledStartAt: new Date("2026-10-14T12:00:00.000Z"),
    status: "DONE",
    ...overrides,
  }) as unknown as OpsOccurrence;

// --- A done visit with team and real hours.
const done = getVisitPayrollImpact(visit())!;
assert.deepEqual(done, {
  employees: [{ id: "ana", name: "Ana" }, { id: "bea", name: "Bea" }],
  hours: 4.5,
  paymentMonthKey: "2026-11",
  workMonthName: "octubre",
});
assert.equal(done.hours, getCompletedVisitHours(visit()), "same hours as payroll");
assert.deepEqual(formatVisitPayrollWarning(done), [
  "Es una visita realizada: se restan 4,5 hs y el transporte a Ana y Bea en los sueldos de octubre.",
]);
assert.deepEqual(formatVisitPayrollWarning(done, ["bea"]), [
  "Es una visita realizada: se restan 4,5 hs y el transporte a Ana y Bea en los sueldos de octubre.",
  "Las horas de octubre ya tienen pagos cargados para Bea: su saldo cambia.",
]);
assert.match(formatVisitPayrollWarning(done, ["ana", "bea"])[1], /para Ana y Bea: sus saldos cambian\.$/);

// --- Done without real hours still pays the transport.
const noHours = getVisitPayrollImpact(visit({ actualEndAt: null, actualStartAt: null }))!;
assert.equal(noHours.hours, 0);
assert.match(formatVisitPayrollWarning(noHours)[0], /: se resta el transporte a Ana y Bea en los sueldos de octubre\.$/);

// --- Nothing to warn: not done, no team, or before payroll tracking.
for (const status of ["SCHEDULED", "SKIPPED", "CANCELED"]) {
  assert.equal(getVisitPayrollImpact(visit({ status })), null, status);
}
assert.equal(getVisitPayrollImpact(visit({ employees: [] })), null);
assert.equal(getVisitPayrollImpact(visit({ scheduledStartAt: new Date("2026-07-20T12:00:00.000Z") })), null);
assert.ok(getVisitPayrollImpact(visit({ scheduledStartAt: new Date("2026-08-01T03:00:00.000Z") })));

// --- The month is local: 31 Dec 22:00 in Montevideo is still December, and
// it is settled by January's payments.
const lateDecember = getVisitPayrollImpact(visit({ scheduledStartAt: new Date("2027-01-01T01:00:00.000Z") }))!;
assert.equal(lateDecember.workMonthName, "diciembre");
assert.equal(lateDecember.paymentMonthKey, "2027-01");

// --- Recorded payments assigned to the payment month, read on the server.
const data = read("data/ops/visit-payroll-status.ts");
assert.match(data, /^import "server-only";/);
assert.match(data, /await requireAdminSession\(\);/);
assert.match(data, /assignedMonth: getAssignedMonthRange\(new Date\(Date\.UTC\(year, month - 1, 1\)\)\)/);
assert.match(data, /status: "RECORDED"/);
assert.doesNotMatch(data, /\.(create|update|upsert|delete)(Many)?\(/);

// --- The warning lives inside the delete confirmation (read only when it
// opens) and refreshes with the payments.
assert.match(read("components/ops/jobs/job-occurrence-dialog.tsx"), /removeNotice=\{occurrence \? <VisitPayrollWarning occurrence=\{occurrence\} \/> : null\}/);
assert.match(read("components/ops/jobs/job-occurrence-dialog-actions.tsx"), /<DeleteDialog[\s\S]*?>\n\s+\{removeNotice\}\n\s+<\/DeleteDialog>/);
assert.match(read("components/ui/delete-dialog.tsx"), /<DialogContent>[\s\S]*\{children\}[\s\S]*<\/DialogContent>/);
assert.match(read("components/ops/hooks/useVisitPaidEmployees.tsx"), /opsQueryKeys\.employeePaymentScope\(`paid-\$\{paymentMonthKey\}`\)/);
// Archiving itself is unchanged: the warning informs, it does not block.
assert.doesNotMatch(read("actions/ops/job-occurrences.ts"), /visit-payroll|getPaidEmployeeIds/);

console.log("check:visit-payroll-impact OK");
