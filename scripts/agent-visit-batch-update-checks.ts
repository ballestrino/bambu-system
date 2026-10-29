import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatProposalsForPrompt } from "../lib/agent/proposal-context";
import { AGENT_SKILLS } from "../lib/agent/skills";
import { buildAgentInstructions } from "../lib/agent/system-prompt";
import { buildUpdateVisitsProposal, resolveUpdateVisits } from "../lib/agent/visit-batch-update-builder";
import { checkVisitProposalPreconditions, selectProposedVisits } from "../lib/agent/visit-proposal-preconditions";
import { visitResult } from "../lib/agent/visit-proposals";
import { batchPayrollWarnings } from "../lib/agent/visit-warnings";
import { isVisitProposal, parseProposalPayload } from "../schemas/agent-proposals";
import { proposeUpdateVisitsInputSchema, type ProposeUpdateVisitsInput } from "../schemas/agent-visit-tools";
import { UpdateJobOccurrencesSchema } from "../schemas/ops/job-occurrence-batch";
import { ANA, DORA, done, employees, roundTrip, UPDATED_AT, visit } from "./agent-visit-fixture";

// Cambiar varias visitas con una sola tarjeta: cada una con las reglas de
// cambiar una, las que ya están así quedan fuera, avisos de sueldos en una
// línea, payload, precondiciones y prompt. Lo usa check:agent-visits.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

const day = (date: number) => ({
  scheduledStartAt: new Date(`2026-10-${date}T12:00:00.000Z`),
  scheduledEndAt: new Date(`2026-10-${date}T16:00:00.000Z`),
});
const V15 = visit({ id: "cvisit000000015", ...day(15) });
const V14 = visit({ id: "cvisit000000014", ...day(14) });
const V16 = done({ id: "cvisit000000016", ...day(16), actualStartAt: day(16).scheduledStartAt, actualEndAt: day(16).scheduledEndAt });

const batch = (overrides: Partial<ProposeUpdateVisitsInput> = {}): ProposeUpdateVisitsInput => ({
  occurrenceIds: [V15.id, V14.id, V16.id],
  status: "DONE",
  employeeIds: null,
  notes: null,
  scheduleLabel: null,
  ...overrides,
});

// --- The tool takes 2 to 20 visits.
assert.ok(proposeUpdateVisitsInputSchema.safeParse(batch()).success);
assert.ok(!proposeUpdateVisitsInputSchema.safeParse(batch({ occurrenceIds: [V14.id] })).success);

// --- Marking them done: sorted by start, the one already done stays out.
const resolved = resolveUpdateVisits({ visits: [V15, V14, V16], input: batch(), employees });
assert.ok(resolved.ok, JSON.stringify(resolved));
assert.deepEqual(resolved.resolved.map((item) => item.visit.id), [V14.id, V15.id]);
assert.deepEqual(resolved.unchanged.map((item) => item.id), [V16.id]);
assert.deepEqual(resolved.resolved[0].patch, {
  status: "DONE",
  actualStartAt: "2026-10-14T12:00:00.000Z",
  actualEndAt: "2026-10-14T16:00:00.000Z",
});

// One line per kind of payroll change, not one per visit, plus paid months.
const pairs = resolved.resolved;
const payroll = batchPayrollWarnings(pairs, new Map());
assert.equal(payroll.length, 1);
assert.match(payroll[0], /^2 visitas pasan a contar para los sueldos de octubre: suman 8 hs y el transporte de cada una a Ana\.$/);
assert.equal(batchPayrollWarnings(pairs, new Map([["2026-11", [ANA.id]]])).length, 2);

const built = buildUpdateVisitsProposal({ input: batch(), ...resolved, overlaps: new Map(), payrollWarnings: payroll });
assert.equal(built.kind, "UPDATE_VISITS");
assert.equal(built.summary.title, "Marcar 2 visitas como realizadas");
assert.deepEqual(built.summary.items?.map((item) => item.label), [
  "Oficina Centro · mié 14/10 09:00–13:00",
  "Oficina Centro · jue 15/10 09:00–13:00",
]);
assert.deepEqual(built.summary.changes.map((change) => [change.label, change.before, change.after]), [["Estado", "Programada", "Realizada"]]);
assert.ok(built.summary.warnings.includes("1 visita ya estaba así y queda fuera."));
assert.ok(built.summary.warnings.includes("Sin horario real: se registra el programado."));
assert.deepEqual(built.payload.visits.map((item) => [item.occurrenceId, item.baseUpdatedAt, item.baseEmployeeIds]), [
  [V14.id, UPDATED_AT.toISOString(), [ANA.id]],
  [V15.id, UPDATED_AT.toISOString(), [ANA.id]],
]);
const parsed = parseProposalPayload("UPDATE_VISITS", roundTrip(built.payload));
assert.ok(parsed && isVisitProposal(parsed) && parsed.kind === "UPDATE_VISITS");
const repeated = { visits: [built.payload.visits[0], built.payload.visits[0]] };
assert.equal(parseProposalPayload("UPDATE_VISITS", roundTrip(repeated)), null);

// A team change is titled as a change; an archived employee refuses the batch
// naming the visit; nothing to change refuses too.
const team = resolveUpdateVisits({ visits: [V14, V15], input: batch({ status: null, employeeIds: [DORA.id] }), employees });
assert.ok(!team.ok);
assert.match(team.message, /^Oficina Centro \(mié 14\/10 09:00–13:00\): Dora está archivada/);
const same = resolveUpdateVisits({ visits: [V16], input: batch({ occurrenceIds: [V16.id, V14.id] }), employees });
assert.ok(!same.ok && same.code === "no_changes");
const notes = resolveUpdateVisits({ visits: [V14, V15], input: batch({ status: null, notes: "Llevar llave" }), employees });
assert.ok(notes.ok);
assert.equal(buildUpdateVisitsProposal({ input: batch({ status: null, notes: "Llevar llave" }), ...notes, overlaps: new Map(), payrollWarnings: [] }).summary.title, "Cambiar 2 visitas");

// --- Confirm: only the checked visits, each with the preconditions of one.
const checked = selectProposedVisits(built.payload.visits, [1]);
assert.deepEqual(checked?.visits.map((item) => item.occurrenceId), [V15.id]);
const state = { archivedAt: null, updatedAt: UPDATED_AT, employeeIds: [ANA.id] };
const edit = (payload: (typeof built.payload.visits)[number]) => ({ kind: "UPDATE_VISIT" as const, payload });
assert.equal(checkVisitProposalPreconditions(edit(built.payload.visits[1]), state), null);
assert.match(checkVisitProposalPreconditions(edit(built.payload.visits[1]), { ...state, updatedAt: new Date() }) ?? "", /cambió/);
const items = (count: number) => Array.from({ length: count }, (_, index) => ({ occurrenceId: `cvisit${String(index).padStart(9, "0")}`, values: { status: "DONE" } }));
assert.ok(UpdateJobOccurrencesSchema.safeParse(items(20)).success);
assert.ok(!UpdateJobOccurrencesSchema.safeParse(items(21)).success);
assert.ok(!UpdateJobOccurrencesSchema.safeParse([...items(1), ...items(1)]).success);

// The model hears which visits the user left out.
const confirmed = (visitIndexes: number[]) => ({
  kind: "UPDATE_VISITS" as const, status: "CONFIRMED" as const, summary: built.summary, error: null,
  result: visitResult([V15.id], visitIndexes),
});
assert.match(formatProposalsForPrompt([confirmed([1])]), /Se cambiaron 1 de 2: el usuario sacó Oficina Centro · mié 14\/10 09:00–13:00, que quedaron como estaban\.$/);
assert.doesNotMatch(formatProposalsForPrompt([confirmed([0, 1])]), /Se cambiaron/);

// --- The prompt asks for one card, and the writes go through one transaction
// after the preconditions.
const prompt = buildAgentInstructions({ today: "martes 27 de octubre de 2026", actorName: null, skill: AGENT_SKILLS.general, memoryBlock: null });
assert.match(prompt, /una sola propuesta con proposeUpdateVisits y todos los ids \(hasta 20 por propuesta\): nunca una tarjeta por visita/);
const executor = read("lib/agent/visit-proposal-execute.ts");
const updateCheckAt = executor.indexOf("checkVisitProposalPreconditions({ kind: \"UPDATE_VISIT\", payload: visit }");
assert.ok(updateCheckAt > 0 && updateCheckAt < executor.indexOf("updateJobOccurrences("));
assert.match(read("lib/ops/job-occurrence-persistence.ts"), /db\.\$transaction\(\n    rows\.map\(\(\{ occurrenceId, data, employeeIds \}\) =>/);
const batchAction = read("actions/ops/job-occurrence-batch.ts");
assert.ok(batchAction.indexOf("prepareOccurrenceUpdate(") < batchAction.indexOf("updateOccurrencesWithEmployees(\n"));
assert.deepEqual(
  read("prisma/migrations/20261027120000_agent_visit_batch_update/migration.sql")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("--")),
  [`ALTER TYPE "AgentProposalKind" ADD VALUE 'UPDATE_VISITS';`]
);
