import assert from "node:assert/strict";

import { formatProposalsForPrompt } from "../lib/agent/proposal-context";
import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { buildAgentInstructions } from "../lib/agent/system-prompt";
import { buildCreateVisitsProposal, resolveCreateVisits, type VisitJob } from "../lib/agent/visit-create-builder";
import { checkCreateVisitsPreconditions, selectProposedVisits } from "../lib/agent/visit-proposal-preconditions";
import { expandVisitDates, formatLocalDate } from "../lib/agent/visit-time";
import { isVisitProposal, parseProposalPayload } from "../schemas/agent-proposals";
import { visitSelectionSchema } from "../schemas/agent-visit-proposals";
import type { ProposeCreateVisitsInput } from "../schemas/agent-visit-tools";
import { CreateJobOccurrencesSchema } from "../schemas/ops/job-occurrence-batch";
import { ANA, BEA, DORA, employees, roundTrip } from "./agent-visit-fixture";

// Crear un lote de visitas: días expandidos en el servidor, el tope de 20,
// el equipo, avisos, payload y precondiciones. Lo usa check:agent-visits.
const JOB: VisitJob = {
  id: "cjob00000000001",
  name: "Oficina Centro",
  status: "ACTIVE",
  archivedAt: null,
  assignments: [{ employeeId: ANA.id, assignedFrom: new Date("2026-01-01T03:00:00.000Z"), assignedTo: null }],
};

const create = (overrides: Partial<ProposeCreateVisitsInput> = {}): ProposeCreateVisitsInput => ({
  jobId: JOB.id,
  dates: null,
  repeatFrom: "2026-10-01",
  repeatTo: "2026-10-31",
  repeatWeekdays: [2],
  startTime: "09:00",
  endTime: "13:00",
  employeeIds: null,
  notes: null,
  scheduleLabel: null,
  ...overrides,
});

const days = (input: ProposeCreateVisitsInput) => {
  const expanded = expandVisitDates(input);
  assert.ok(expanded.ok, JSON.stringify(expanded));
  return expanded.dates.map(formatLocalDate);
};

// --- Weekday repetition is expanded on the server: Tuesdays of October 2026.
assert.deepEqual(days(create()), ["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27"]);
assert.deepEqual(days(create({ repeatWeekdays: [1, 3] , repeatTo: "2026-10-12" })), ["2026-10-05", "2026-10-07", "2026-10-12"]);
assert.deepEqual(days(create({ dates: ["2026-10-09", "2026-10-02", "2026-10-09"], repeatFrom: null, repeatTo: null, repeatWeekdays: null })), ["2026-10-02", "2026-10-09"]);
// An empty list counts as not sent.
assert.deepEqual(days(create({ dates: [] })), ["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27"]);
const refused = (input: ProposeCreateVisitsInput) => {
  const expanded = expandVisitDates(input);
  assert.ok(!expanded.ok);
  return expanded.code;
};
assert.equal(refused(create({ dates: ["2026-10-06"] })), "invalid_dates");
assert.equal(refused(create({ repeatTo: null })), "invalid_dates");
assert.equal(refused(create({ dates: ["2026-02-30"], repeatFrom: null, repeatTo: null, repeatWeekdays: null })), "invalid_dates");
assert.equal(refused(create({ repeatTo: "2026-09-30" })), "invalid_dates");
assert.equal(refused(create({ repeatWeekdays: [0] })), "invalid_dates");
assert.equal(refused(create({ repeatTo: "2028-01-01" })), "invalid_dates");

// --- Slots in Montevideo time and the cap of 20.
const resolved = resolveCreateVisits(JOB, create());
assert.ok(resolved.ok);
assert.deepEqual(resolved.slots[0], { start: new Date("2026-10-06T12:00:00.000Z"), end: new Date("2026-10-06T16:00:00.000Z") });
assert.deepEqual(resolved.teamIds, [ANA.id]);
const code = (job: VisitJob, input: ProposeCreateVisitsInput) => {
  const result = resolveCreateVisits(job, input);
  assert.ok(!result.ok);
  return result.code;
};
assert.equal(code(JOB, create({ repeatWeekdays: [1, 2, 3, 4, 5, 6, 7] })), "too_many");
assert.match((resolveCreateVisits(JOB, create({ repeatWeekdays: [1, 2, 3, 4, 5, 6, 7] })) as { message: string }).message, /Son 31 visitas/);
assert.ok(resolveCreateVisits(JOB, create({ repeatWeekdays: [1, 2, 3, 4, 5], repeatTo: "2026-10-28" })).ok);
assert.equal(code(JOB, create({ repeatFrom: "2026-10-07", repeatTo: "2026-10-12" })), "no_dates");
assert.equal(code(JOB, create({ endTime: "09:00" })), "invalid_time");
assert.equal(code(JOB, create({ startTime: "24:00" })), "invalid_time");
assert.equal(code({ ...JOB, archivedAt: new Date() }, create()), "archived_job");
// The job's team changes inside the range: ask for it explicitly.
const handover = { ...JOB, assignments: [{ ...JOB.assignments[0], assignedTo: new Date("2026-10-15T03:00:00.000Z") }] };
assert.equal(code(handover, create()), "team_changes");
assert.deepEqual((resolveCreateVisits(handover, create({ employeeIds: [BEA.id, BEA.id] })) as { teamIds: string[] }).teamIds, [BEA.id]);

// --- The card lists every visit; the payload survives JSON and both schemas.
const build = (overrides: Partial<Parameters<typeof buildCreateVisitsProposal>[0]> = {}) =>
  buildCreateVisitsProposal({
    job: JOB, input: create(), slots: resolved.slots, teamIds: [ANA.id], employees, takenStarts: [], teamVisits: [],
    now: new Date("2026-10-01T12:00:00.000Z"), ...overrides,
  });
const built = build();
assert.ok(built.ok);
assert.equal(built.summary.title, "Agendar 4 visitas de Oficina Centro");
assert.deepEqual(built.summary.items?.map((item) => item.label), [
  "mar 06/10 09:00–13:00", "mar 13/10 09:00–13:00", "mar 20/10 09:00–13:00", "mar 27/10 09:00–13:00",
]);
assert.deepEqual(built.summary.changes.map((change) => [change.label, change.after]), [["Equipo", "Ana"]]);
assert.deepEqual(built.summary.warnings, []);
const parsed = parseProposalPayload("CREATE_VISITS", roundTrip(built.payload));
assert.ok(parsed && isVisitProposal(parsed) && parsed.kind === "CREATE_VISITS");
const batch = CreateJobOccurrencesSchema.safeParse(parsed.payload);
assert.ok(batch.success);
assert.equal(batch.data.visits.length, 4);
assert.equal(batch.data.notes, undefined);
assert.equal(parseProposalPayload("CREATE_VISITS", { ...built.payload, visits: [] }), null);

// Warnings: overlaps (also on the visit's row), the past, inactive employees,
// no team and a job that is not active.
const overlap = { job: "Burger Time", start: new Date("2026-10-13T11:00:00.000Z"), end: new Date("2026-10-13T13:00:00.000Z"), employees: ["Ana"] };
const warned = build({ teamVisits: [overlap], now: new Date("2026-10-14T12:00:00.000Z") });
assert.ok(warned.ok);
assert.deepEqual(warned.summary.warnings, ["Se cruza con Burger Time (mar 13/10 08:00–10:00) de Ana.", "2 visitas ya pasaron y quedan programadas."]);
assert.deepEqual(warned.summary.items?.map((item) => item.detail), [null, "Se cruza con Burger Time", null, null]);
const quiet = build({ job: { ...JOB, status: "PAUSED" }, teamIds: [BEA.id] });
assert.ok(quiet.ok);
assert.deepEqual(quiet.summary.warnings, ["El trabajo está pausado.", "Bea está inactiva."]);
const empty = build({ teamIds: [], input: create({ notes: "  Llevar llave  ", scheduleLabel: "" }) });
assert.ok(empty.ok);
assert.deepEqual(empty.summary.warnings, ["Sin equipo: las visitas quedan sin empleadas asignadas."]);
assert.deepEqual([empty.payload.notes, empty.payload.scheduleLabel], ["Llevar llave", null]);
const rejected = (overrides: Parameters<typeof build>[0]) => {
  const result = build(overrides);
  assert.ok(!result.ok);
  return result.code;
};
assert.equal(rejected({ teamIds: [DORA.id] }), "archived_employee");
assert.equal(rejected({ teamIds: ["cnobody00000001"] }), "not_found");
assert.equal(rejected({ takenStarts: [new Date("2026-10-20T12:00:00.000Z")] }), "already_scheduled");

// --- The batch schema: at most 20, distinct starts, end after start.
const visitAt = (day: number) => ({ scheduledStartAt: `2026-11-${String(day).padStart(2, "0")}T12:00:00.000Z`, scheduledEndAt: `2026-11-${String(day).padStart(2, "0")}T16:00:00.000Z` });
const batchOf = (visits: unknown[]) => CreateJobOccurrencesSchema.safeParse({ jobId: JOB.id, visits }).success;
assert.ok(batchOf(Array.from({ length: 20 }, (_, index) => visitAt(index + 1))));
assert.ok(!batchOf(Array.from({ length: 21 }, (_, index) => visitAt(index + 1))));
assert.ok(!batchOf([visitAt(1), visitAt(1)]));
assert.ok(!batchOf([{ scheduledStartAt: visitAt(1).scheduledEndAt, scheduledEndAt: visitAt(1).scheduledStartAt }]));

// --- Preconditions on confirm.
const live = { job: { name: JOB.name, status: "ACTIVE", archivedAt: null }, employees: [{ ...ANA, archivedAt: null }], takenStarts: [] };
assert.equal(checkCreateVisitsPreconditions(built.payload, live), null);
assert.match(checkCreateVisitsPreconditions(built.payload, { ...live, job: null }) ?? "", /ya no existe/);
assert.match(checkCreateVisitsPreconditions(built.payload, { ...live, job: { ...live.job, archivedAt: new Date() } }) ?? "", /fue archivado/);
assert.match(checkCreateVisitsPreconditions(built.payload, { ...live, employees: [] }) ?? "", /ya no existe/);
assert.equal(checkCreateVisitsPreconditions(built.payload, { ...live, employees: [{ ...ANA, archivedAt: new Date() }] }), "Ana fue archivada: pedile al asistente una nueva.");
assert.equal(
  checkCreateVisitsPreconditions(built.payload, { ...live, takenStarts: [new Date("2026-10-13T12:00:00.000Z")] }),
  "Oficina Centro ya tiene una visita el mar 13/10 09:00: no se creó ninguna. Pedile al asistente una nueva."
);

// --- The user unchecks visits on the card: only the checked ones are checked
// and created, and the model is told which were left out.
assert.deepEqual(selectProposedVisits(built.payload.visits)?.indexes, [0, 1, 2, 3]);
const picked = selectProposedVisits(built.payload.visits, [3, 0]);
assert.deepEqual(picked?.indexes, [0, 3]);
assert.deepEqual(picked?.visits.map((visit) => visit.scheduledStartAt), ["2026-10-06T12:00:00.000Z", "2026-10-27T12:00:00.000Z"]);
assert.equal(selectProposedVisits(built.payload.visits, [4]), null);
const pickedPayload = { ...built.payload, visits: picked!.visits };
assert.equal(checkCreateVisitsPreconditions(pickedPayload, { ...live, takenStarts: [new Date("2026-10-13T12:00:00.000Z")] }), null);
assert.ok(visitSelectionSchema.safeParse([0, 2]).success);
[[], [1, 1], [-1], [0.5], [20]].forEach((indexes) => assert.ok(!visitSelectionSchema.safeParse(indexes).success, JSON.stringify(indexes)));
const confirmedBatch = (visitIndexes?: number[]) => ({
  kind: "CREATE_VISITS" as const, status: "CONFIRMED" as const, summary: built.summary, error: null,
  result: { label: "Visitas", url: "/dashboard/calendar", budgetId: null, slug: null, officialBudgetId: null, officialVersion: null, visitIndexes },
});
assert.match(formatProposalsForPrompt([confirmedBatch([0, 3])]), /Se agendaron 2 de 4: el usuario sacó mar 13\/10 09:00–13:00, mar 20\/10 09:00–13:00, que no se agendaron\.$/);
assert.doesNotMatch(formatProposalsForPrompt([confirmedBatch([0, 1, 2, 3])]), /Se agendaron/);
assert.doesNotMatch(formatProposalsForPrompt([confirmedBatch()]), /Se agendaron/);

// --- General has the tool and the rule tells how to send the days.
assert.ok(resolveSkillToolNames(AGENT_SKILLS.general).includes("proposeCreateVisits"));
(["presupuestos", "emails", "consejos"] as const).forEach((skill) =>
  assert.ok(!resolveSkillToolNames(AGENT_SKILLS[skill]).includes("proposeCreateVisits"), skill)
);
const prompt = buildAgentInstructions({ today: "miércoles 21 de octubre de 2026", actorName: null, skill: AGENT_SKILLS.general, approvedKnowledge: [] });
assert.match(prompt, /proposeCreateVisits un lote de hasta 20 visitas/);
assert.match(prompt, /repeatFrom, repeatTo y repeatWeekdays \(1 lunes … 7 domingo\): no calcules las fechas/);
assert.match(prompt, /el usuario puede desmarcar visitas antes de confirmar: las desmarcadas no se agendan/);
const interrupted = { kind: "CREATE_VISITS" as const, status: "EXECUTING" as const, summary: built.summary, result: null, error: null, unknownOutcome: true };
assert.match(formatProposalsForPrompt([interrupted]), /revisá las visitas con queryOperations/);
