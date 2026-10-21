import assert from "node:assert/strict";

import { formatLocalDateTime, formatVisitRange, parseLocalDateTime } from "../lib/agent/visit-time";
import { resolveVisitUpdate, type ResolvedVisitUpdate } from "../lib/agent/visit-update-builder";
import { ANA, BEA, DORA, done, employees, input, visit } from "./agent-visit-fixture";

// Horarios de Montevideo y cómo se arma el cambio de una visita. Lo usa
// check:agent-visits.

// --- Local times: Montevideo is UTC-3; impossible dates don't round-trip.
assert.equal(parseLocalDateTime("2026-10-06 09:00")?.toISOString(), "2026-10-06T12:00:00.000Z");
assert.equal(parseLocalDateTime("2026-10-06T13:30")?.toISOString(), "2026-10-06T16:30:00.000Z");
assert.equal(parseLocalDateTime("2026-02-30 09:00"), null);
assert.equal(parseLocalDateTime("2026-10-06 24:00"), null);
assert.equal(parseLocalDateTime("06/10/2026 09:00"), null);
assert.equal(formatLocalDateTime(new Date("2026-10-06T12:00:00.000Z")), "2026-10-06 09:00");
const start = new Date("2026-10-14T12:00:00.000Z");
assert.equal(formatVisitRange(start, new Date("2026-10-14T16:00:00.000Z")), "mié 14/10 09:00–13:00");
assert.equal(formatVisitRange(start, new Date("2026-10-15T04:00:00.000Z")), "mié 14/10 09:00–jue 15/10 01:00");

const resolve = (overrides: Parameters<typeof input>[0], source = visit()) =>
  resolveVisitUpdate({ visit: source, input: input(overrides), employees });
const ok = (result: ReturnType<typeof resolve>) => {
  assert.ok(result.ok, JSON.stringify(result));
  return result as ResolvedVisitUpdate;
};
const refused = (result: ReturnType<typeof resolve>, code: string) => {
  assert.ok(!result.ok);
  assert.equal(result.code, code, result.message);
};

// --- Moving only the start keeps the duration; only changed keys go out.
const moved = ok(resolve({ start: "2026-10-15 10:00" }));
assert.deepEqual(moved.patch, {
  scheduledStartAt: "2026-10-15T13:00:00.000Z",
  scheduledEndAt: "2026-10-15T17:00:00.000Z",
});
assert.deepEqual(ok(resolve({ end: "2026-10-14 14:00" })).patch, { scheduledEndAt: "2026-10-14T17:00:00.000Z" });
refused(resolve({ end: "2026-10-14 08:00" }), "invalid_time");
refused(resolve({ start: "2026-02-30 09:00" }), "invalid_time");
refused(resolve({ start: "2026-10-14 09:00" }), "no_changes");
refused(resolve({}), "no_changes");

// --- Registering real hours marks it done; done without them takes the
// schedule, like the register form; leaving done clears them.
const registered = ok(resolve({ actualStart: "2026-10-14 09:15", actualEnd: "2026-10-14 13:30" }));
assert.deepEqual(registered.patch, {
  status: "DONE",
  actualStartAt: "2026-10-14T12:15:00.000Z",
  actualEndAt: "2026-10-14T16:30:00.000Z",
});
assert.ok(registered.notices.includes("Registrar el horario real la marca como realizada."));
const onlyStart = ok(resolve({ actualStart: "2026-10-14 10:00" }));
assert.equal(onlyStart.patch.actualEndAt, "2026-10-14T17:00:00.000Z", "keeps the scheduled duration");
const markedDone = ok(resolve({ status: "DONE" }));
assert.deepEqual(markedDone.patch, {
  status: "DONE",
  actualStartAt: "2026-10-14T12:00:00.000Z",
  actualEndAt: "2026-10-14T16:00:00.000Z",
});
assert.ok(markedDone.notices.includes("Sin horario real: se registra el programado."));
assert.deepEqual(ok(resolve({ status: "CANCELED" }, done())).patch, {
  status: "CANCELED",
  actualStartAt: null,
  actualEndAt: null,
});
assert.deepEqual(ok(resolve({ status: "SKIPPED" })).patch, { status: "SKIPPED" });
refused(resolve({ status: "CANCELED", actualStart: "2026-10-14 09:00" }), "invalid_values");
refused(resolve({ actualStart: "2026-10-14 13:00", actualEnd: "2026-10-14 09:00" }), "invalid_time");
assert.deepEqual(ok(resolve({ actualEnd: "2026-10-14 14:00" }, done())).patch, { actualEndAt: "2026-10-14T17:00:00.000Z" });

// --- The team is the full list after the change: unknown or newly archived
// employees are refused, inactive ones are warned about.
const team = ok(resolve({ employeeIds: [ANA.id, BEA.id, BEA.id] }));
assert.deepEqual(team.patch, { employeeIds: [ANA.id, BEA.id] });
assert.deepEqual(team.notices, ["Bea está inactiva."]);
assert.deepEqual(ok(resolve({ employeeIds: [] })).patch, { employeeIds: [] });
refused(resolve({ employeeIds: ["cnope0000000001"] }), "not_found");
refused(resolve({ employeeIds: [DORA.id] }), "archived_employee");
refused(resolve({ employeeIds: [ANA.id] }), "no_changes");

// --- Text fields: "" clears, spaces are trimmed, null keeps.
assert.deepEqual(ok(resolve({ notes: "  Llevar escalera " })).patch, { notes: "Llevar escalera" });
assert.deepEqual(ok(resolve({ notes: "" }, visit({ notes: "Vieja" }))).patch, { notes: null });
refused(resolve({ notes: "" }), "no_changes");
assert.deepEqual(ok(resolve({ scheduleLabel: "Centro" })).patch, { scheduleLabel: "Centro" });

// --- A job that is not active is only a notice.
const paused = ok(resolve({ notes: "x" }, visit({ job: { id: "j", name: "Oficina Centro", status: "PAUSED" } })));
assert.deepEqual(paused.notices, ["El trabajo está pausado."]);
