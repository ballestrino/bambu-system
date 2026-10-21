import assert from "node:assert/strict";

import { formatProposalsForPrompt } from "../lib/agent/proposal-context";
import { getSummaryAmounts } from "../lib/agent/proposal-summary";
import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { buildAgentInstructions, VISIT_RULE } from "../lib/agent/system-prompt";
import { toVisitState } from "../lib/agent/visit-format";
import { checkVisitProposalPreconditions } from "../lib/agent/visit-proposal-preconditions";
import { VISIT_GONE_MESSAGE, VISIT_STALE_MESSAGE, visitResult } from "../lib/agent/visit-proposals";
import { buildArchiveVisitProposal, buildUpdateVisitProposal, resolveVisitUpdate } from "../lib/agent/visit-update-builder";
import { buildArchiveVisitWarnings, buildUpdateVisitWarnings, capWarnings, payrollChangeWarnings } from "../lib/agent/visit-warnings";
import { isVisitProposal, parseProposalPayload, type ParsedVisitProposal } from "../schemas/agent-proposals";
import { visitPatchSchema } from "../schemas/agent-visit-proposals";
import { UpdateJobOccurrenceSchema } from "../schemas/ops/job-occurrence";
import { ANA, BEA, DORA, UPDATED_AT, done, employees, input, roundTrip, visit } from "./agent-visit-fixture";

// Avisos, payloads, precondiciones y prompt de las propuestas de visitas. Lo
// usa check:agent-visits.
const state = (overrides = {}) => toVisitState(visit(overrides));

// --- Payroll: a done visit counts its real hours and a transport for each
// employee in the month it was scheduled (October 2026 is tracked).
const scheduled = state();
const doneState = toVisitState(done());
assert.deepEqual(payrollChangeWarnings(scheduled, doneState, { before: [], after: [] }), [
  "Pasa a contar para los sueldos de octubre: suma 4 hs y el transporte a Ana.",
]);
assert.deepEqual(payrollChangeWarnings(doneState, { ...doneState, status: "CANCELED" }, { before: [ANA.id], after: [] }), [
  "Sale de los sueldos de octubre: se resta 4 hs y el transporte a Ana.",
  "Las horas de octubre ya tienen pagos cargados para Ana: su saldo cambia.",
]);
const longer = { ...doneState, actualEndAt: new Date("2026-10-14T17:00:00.000Z") };
assert.deepEqual(payrollChangeWarnings(doneState, longer, { before: [], after: [] }), [
  "Cambia los sueldos de octubre: de 4 a 5 hs para Ana.",
]);
assert.deepEqual(payrollChangeWarnings(scheduled, { ...scheduled, notes: "x" }, { before: [], after: [] }), []);
// July 2026 is before payroll tracking: nothing to warn.
const july = toVisitState(done({ scheduledStartAt: new Date("2026-07-14T12:00:00.000Z") }));
assert.deepEqual(payrollChangeWarnings(july, { ...july, status: "CANCELED" }, { before: [], after: [] }), []);

// --- Overlaps, the past and the cap of three warnings.
const now = new Date("2026-10-20T12:00:00.000Z");
const overlap = { job: "Burger Time", start: new Date("2026-10-14T11:00:00.000Z"), end: new Date("2026-10-14T15:00:00.000Z"), employees: ["Ana"] };
assert.deepEqual(
  buildUpdateVisitWarnings({ before: scheduled, after: { ...scheduled, scheduledStartAt: new Date("2026-10-15T12:00:00.000Z") }, notices: [], overlaps: [overlap], paid: { before: [], after: [] }, now }),
  ["Se cruza con Burger Time (mié 14/10 08:00–12:00) de Ana.", "El horario nuevo ya pasó y la visita queda programada."]
);
assert.deepEqual(capWarnings(["a", "b", "c", "d", "e"]), ["a", "b", "c", "Y 2 avisos más."]);
assert.deepEqual(buildArchiveVisitWarnings(doneState, [ANA.id]), [
  "Es una visita realizada: se restan 4 hs y el transporte a Ana en los sueldos de octubre.",
  "Las horas de octubre ya tienen pagos cargados para Ana: su saldo cambia.",
]);
assert.deepEqual(buildArchiveVisitWarnings(scheduled, []), []);

// --- Payloads survive JSON and the screen's own update schema; the patch is
// strict (never touches the rule) and never empty.
const resolved = resolveVisitUpdate({ visit: visit(), input: input({ start: "2026-10-15 10:00", employeeIds: [ANA.id, BEA.id] }), employees });
assert.ok(resolved.ok);
const update = buildUpdateVisitProposal(visit(), resolved, ["aviso"]);
const parsedUpdate = parseProposalPayload(update.kind, roundTrip(update.payload));
assert.ok(parsedUpdate && isVisitProposal(parsedUpdate) && parsedUpdate.kind === "UPDATE_VISIT");
assert.deepEqual(parsedUpdate.payload.baseEmployeeIds, [ANA.id]);
assert.equal(parsedUpdate.payload.baseUpdatedAt, UPDATED_AT.toISOString());
assert.ok(UpdateJobOccurrenceSchema.safeParse(parsedUpdate.payload.patch).success);
assert.equal(update.summary.title, "Cambiar la visita de Oficina Centro");
assert.deepEqual(update.summary.changes.map((change) => [change.label, change.before, change.after]), [
  ["Horario", "mié 14/10 09:00–13:00", "jue 15/10 10:00–14:00"],
  ["Equipo", "Ana", "Ana, Bea"],
]);
assert.deepEqual([update.summary.slug, update.summary.before, update.summary.after, update.summary.stored], [null, null, null, []]);
// A visit card has no citable amounts.
assert.deepEqual(getSummaryAmounts(update.summary), []);
assert.equal(visitPatchSchema.safeParse({}).success, false);
assert.equal(visitPatchSchema.safeParse({ scheduleRuleId: null }).success, false);
assert.equal(visitPatchSchema.safeParse({ isDetached: true }).success, false);
assert.equal(visitPatchSchema.safeParse({ generatedStartAt: "2026-10-14T12:00:00.000Z" }).success, false);
assert.equal(visitPatchSchema.safeParse({ scheduledStartAt: "2026-10-14 09:00" }).success, false);
const archive = buildArchiveVisitProposal(visit(), []);
const parsedArchive = parseProposalPayload(archive.kind, roundTrip(archive.payload));
assert.ok(parsedArchive && isVisitProposal(parsedArchive));
assert.deepEqual(archive.summary.changes[0], {
  field: "visit", label: "Visita", before: "mié 14/10 09:00–13:00 · Ana · Programada", after: "Eliminada",
});

// --- Preconditions against a fresh read.
const live = { archivedAt: null, updatedAt: UPDATED_AT, employeeIds: [ANA.id] };
const updateProposal = parsedUpdate as ParsedVisitProposal;
const all = [
  { ...ANA, archivedAt: null },
  { ...BEA, archivedAt: null },
];
assert.equal(checkVisitProposalPreconditions(updateProposal, live, all), null);
assert.equal(checkVisitProposalPreconditions(updateProposal, null, all), VISIT_GONE_MESSAGE);
assert.equal(checkVisitProposalPreconditions(updateProposal, { ...live, archivedAt: new Date() }, all), VISIT_GONE_MESSAGE);
assert.equal(checkVisitProposalPreconditions(updateProposal, { ...live, updatedAt: new Date(UPDATED_AT.getTime() + 1) }, all), VISIT_STALE_MESSAGE);
// The team changed from the job without touching the visit's updatedAt.
assert.equal(checkVisitProposalPreconditions(updateProposal, { ...live, employeeIds: [] }, all), VISIT_STALE_MESSAGE);
assert.match(checkVisitProposalPreconditions(updateProposal, live, [all[0]]) ?? "", /ya no existe/);
assert.equal(
  checkVisitProposalPreconditions(updateProposal, live, [all[0], { ...BEA, archivedAt: new Date() }]),
  "Bea fue archivada: pedile al asistente una nueva."
);
const archiveProposal = parsedArchive as ParsedVisitProposal;
assert.equal(checkVisitProposalPreconditions(archiveProposal, live), null);
assert.equal(checkVisitProposalPreconditions(archiveProposal, { ...live, updatedAt: new Date() }), VISIT_STALE_MESSAGE);
assert.ok(DORA.id);

// --- Prompt and tools: General has the visit tools and their rule; the
// other skills don't. An interrupted visit proposal says where to look.
const prompt = (skill: keyof typeof AGENT_SKILLS) =>
  buildAgentInstructions({ today: "miércoles 21 de octubre de 2026", actorName: null, skill: AGENT_SKILLS[skill], approvedKnowledge: [] });
assert.ok(prompt("general").includes(VISIT_RULE));
assert.match(prompt("general"), /Lo único que podés eliminar es una visita/);
(["presupuestos", "emails", "consejos"] as const).forEach((skill) => assert.ok(!prompt(skill).includes(VISIT_RULE), skill));
(["proposeUpdateVisit", "proposeArchiveVisit"] as const).forEach((name) => {
  assert.ok(resolveSkillToolNames(AGENT_SKILLS.general).includes(name), name);
  (["presupuestos", "emails", "consejos"] as const).forEach((skill) =>
    assert.ok(!resolveSkillToolNames(AGENT_SKILLS[skill]).includes(name), `${skill}: ${name}`)
  );
});
const interrupted = { kind: "UPDATE_VISIT" as const, status: "EXECUTING" as const, summary: update.summary, result: null, error: null, unknownOutcome: true };
assert.match(formatProposalsForPrompt([interrupted]), /revisá la visita con queryOperations/);
const confirmed = { ...interrupted, status: "CONFIRMED" as const, unknownOutcome: false, result: visitResult([ANA.id]) };
assert.match(formatProposalsForPrompt([confirmed]), /Quedó en \/dashboard\/calendar\./);
