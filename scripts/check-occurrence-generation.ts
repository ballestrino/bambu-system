import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { JobScheduleRule } from "@prisma/client";

import { buildCandidateStarts, getRuleGenerationWindow } from "../lib/ops/job-occurrence-recurrence";
import {
  getTodayKey,
  laterDateKey,
  monthPreset,
  nextDaysPreset,
  untilMonthEndPreset,
  weekPreset,
} from "../lib/ops/occurrence-generation-presets";
import { resolveOccurrenceGenerationRange } from "../lib/ops/occurrence-generation-range";
import {
  getReplacementReasons,
  isUntouchedOccurrence,
  resolveEmployeeIds,
} from "../lib/ops/occurrence-replacement";
import { toLocalDateKey } from "../lib/ops/schedule-week";
import { addLocalDays, getLocalDate } from "../lib/ops/timezone";
import { OccurrenceGenerationSchema } from "../schemas/ops/occurrence-generation";

// Feature 9: las visitas se generan a mano para un rango elegido y ninguna
// lectura escribe. Montevideo es UTC-3 todo el año. CRLF normalizado.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const TZ = "America/Montevideo";
const today = getTodayKey();
const inDays = (days: number) => {
  const [year, month, day] = today.split("-").map(Number);
  return toLocalDateKey(addLocalDays({ day, month, year }, days));
};

// --- The range: local days, past allowed, never past the 3-month horizon.
const range = resolveOccurrenceGenerationRange("2026-10-25", "2026-10-31", TZ, new Date("2026-10-20T15:00:00Z"))!;
assert.equal(range.start.toISOString(), "2026-10-25T03:00:00.000Z");
assert.equal(range.end.toISOString(), "2026-11-01T02:59:59.999Z");
assert.equal(range.startsInPast, false);
assert.equal(resolveOccurrenceGenerationRange("2026-10-25", "2026-10-31", TZ, new Date("2026-10-28T15:00:00Z"))!.startsInPast, true);
assert.equal(resolveOccurrenceGenerationRange("2026-10-31", "2026-10-25"), null);
assert.equal(resolveOccurrenceGenerationRange("25/10/2026", "2026-10-31"), null);
const capped = resolveOccurrenceGenerationRange(today, inDays(120))!;
assert.equal(capped.cappedAtHorizon, true);
assert.equal(capped.end.getTime(), capped.horizonEnd.getTime());
assert.equal(resolveOccurrenceGenerationRange(inDays(200), inDays(210))!.isEmpty, true);
assert.equal(resolveOccurrenceGenerationRange(today, inDays(6))!.cappedAtHorizon, false);

// --- A rule's window inside the range: a service that starts on the 25th is
// generated from the 25th, one that ends mid-range stops there.
const rule = (overrides: Partial<JobScheduleRule>): JobScheduleRule => ({
  createdAt: new Date(), createdById: "user", dayOfMonth: null, durationMinutes: 180,
  endDate: null, frequency: "WEEKLY", id: "rule", interval: 1, isActive: true, jobId: "job",
  startDate: new Date("2026-01-05T12:00:00Z"), startTimeMinutes: 9 * 60, timezone: TZ,
  updatedAt: new Date(), updatedById: null, weekdays: [1, 3, 5], ...overrides,
});
const week = resolveOccurrenceGenerationRange(inDays(0), inDays(20))!;
const lateStart = rule({ startDate: new Date(`${inDays(10)}T15:00:00Z`) });
const lateWindow = getRuleGenerationWindow(lateStart, week)!;
assert.equal(toLocalDateKey(getLocalDate(lateWindow.start, TZ)), inDays(10));
const earlyEnd = rule({ endDate: new Date(`${inDays(5)}T15:00:00Z`) });
assert.equal(toLocalDateKey(getLocalDate(getRuleGenerationWindow(earlyEnd, week)!.end, TZ)), inDays(5));
assert.equal(getRuleGenerationWindow(rule({ startDate: new Date(`${inDays(30)}T15:00:00Z`) }), week), null);
// The window keeps the horizon cap on its own, even for a range that skipped
// resolveOccurrenceGenerationRange.
const farRange = { end: new Date(Date.now() + 200 * 86_400_000), start: new Date() };
const longRule = rule({ endDate: new Date(Date.now() + 300 * 86_400_000) });
assert.ok(getRuleGenerationWindow(longRule, farRange)!.end.getTime() <= capped.horizonEnd.getTime());
// Past weeks are allowed (to register visits already done).
const past = resolveOccurrenceGenerationRange("2026-01-12", "2026-01-18")!;
assert.ok(getRuleGenerationWindow(rule({}), past));

// --- Candidate starts: Mon/Wed/Fri at 09:00 local in a Monday-to-Sunday week.
const starts = buildCandidateStarts(rule({}), past);
assert.deepEqual(starts.map((start) => start.toISOString()), [
  "2026-01-12T12:00:00.000Z",
  "2026-01-14T12:00:00.000Z",
  "2026-01-16T12:00:00.000Z",
]);

// --- Replacement: a visit no longer matches when its day or time, duration or
// team changed, or its rule is inactive. Only untouched visits are replaced.
const assignments = [
  { assignedFrom: new Date("2026-01-01T00:00:00Z"), assignedTo: new Date("2026-01-13T00:00:00Z"), employeeId: "ana" },
  { assignedFrom: new Date("2026-01-13T00:00:00Z"), assignedTo: null, employeeId: "bea" },
];
assert.deepEqual(resolveEmployeeIds(assignments, new Date("2026-01-12T12:00:00Z")), ["ana"]);
assert.deepEqual(resolveEmployeeIds(assignments, new Date("2026-01-14T12:00:00Z")), ["bea"]);
const candidateTimes = new Set(starts.map((start) => start.getTime()));
const visit = (startIso: string, minutes: number, employeeIds: string[]) => ({
  employeeIds,
  scheduledEndAt: new Date(new Date(startIso).getTime() + minutes * 60_000),
  scheduledStartAt: new Date(startIso),
});
const reasons = (occurrence: ReturnType<typeof visit>, overrides: Partial<JobScheduleRule> = {}) =>
  getReplacementReasons({ assignments, candidateTimes, occurrence, rule: rule(overrides) });
assert.deepEqual(reasons(visit("2026-01-14T12:00:00.000Z", 180, ["bea"])), []);
assert.deepEqual(reasons(visit("2026-01-14T13:00:00.000Z", 180, ["bea"])), ["schedule"]);
assert.deepEqual(reasons(visit("2026-01-14T12:00:00.000Z", 240, ["bea"])), ["duration"]);
assert.deepEqual(reasons(visit("2026-01-14T12:00:00.000Z", 180, ["ana"])), ["team"]);
assert.deepEqual(reasons(visit("2026-01-14T12:00:00.000Z", 180, ["bea"]), { isActive: false }), ["inactiveRule"]);
const untouched = { actualEndAt: null, actualStartAt: null, timeEntryCount: 0, updatedById: null };
assert.equal(isUntouchedOccurrence(untouched), true);
assert.equal(isUntouchedOccurrence({ ...untouched, updatedById: "user" }), false, "moved or edited");
assert.equal(isUntouchedOccurrence({ ...untouched, actualStartAt: new Date() }), false);
assert.equal(isUntouchedOccurrence({ ...untouched, timeEntryCount: 1 }), false);

// --- Suggested ranges.
assert.deepEqual(weekPreset("2026-09-24", "Semana"), { endDate: "2026-09-27", label: "Semana", startDate: "2026-09-21" });
assert.deepEqual(monthPreset("2026-02-10"), { endDate: "2026-02-28", label: "Mes", startDate: "2026-02-01" });
assert.deepEqual(untilMonthEndPreset("2026-10-25"), { endDate: "2026-10-31", label: "Hasta fin de mes", startDate: "2026-10-25" });
assert.deepEqual(nextDaysPreset("2026-12-29", 7, "7 días"), { endDate: "2027-01-04", label: "7 días", startDate: "2026-12-29" });
assert.equal(laterDateKey("2026-09-24", "2026-10-01"), "2026-10-01");

// --- Schema: a day range of up to 93 days.
const valid = { endDate: "2026-10-31", startDate: "2026-10-25" };
assert.ok(OccurrenceGenerationSchema.safeParse(valid).success);
assert.ok(OccurrenceGenerationSchema.safeParse({ endDate: "2027-01-01", startDate: "2026-10-01" }).success);
assert.equal(OccurrenceGenerationSchema.safeParse({ endDate: "2027-01-02", startDate: "2026-10-01" }).success, false);
assert.equal(OccurrenceGenerationSchema.safeParse({ endDate: "2026-10-24", startDate: "2026-10-25" }).success, false);
assert.equal(OccurrenceGenerationSchema.safeParse({ ...valid, startDate: "25-10-2026" }).success, false);
assert.equal(OccurrenceGenerationSchema.safeParse({ ...valid, jobId: "x" }).success, false);
assert.equal(OccurrenceGenerationSchema.safeParse({ ...valid, replaceIds: ["no-es-cuid"] }).success, false);

// --- Replacing only deletes what is still replaceable when it runs: future,
// scheduled, attached, untouched visits, re-checked on the server.
const replacement = read("lib/ops/occurrence-replacement-query.ts");
assert.match(replacement, /const from = new Date\(Math\.max\(range\.start\.getTime\(\), now\.getTime\(\)\)\);/);
assert.match(replacement, /isDetached: false,[\s\S]*?scheduledStartAt: \{ gte: from, lte: range\.end \},[\s\S]*?status: "SCHEDULED",/);
assert.match(replacement, /const \{ replaceable \} = await findReplaceableOccurrences\(range, filters\);/);
// Nothing is picked by default: deleting is always an explicit choice.
const selection = read("components/ops/occurrences/use-replacement-selection.ts");
assert.match(selection, /const \[selected, setSelected\] = useState<Set<string>>\(\(\) => new Set\(\)\);/);
assert.match(selection, /const chosen = replaceable\.filter\(\(occurrence\) => selected\.has\(occurrence\.id\)\);/);
// The ids from the client only narrow the list the server recomputes.
assert.match(replacement, /const allowed = replaceable\.map\(\(occurrence\) => occurrence\.id\)\.filter\(\(id\) => ids\.includes\(id\)\);/);
assert.match(replacement, /deleteMany\(\{\n\s+where: \{\n\s+actualEndAt: null,\n\s+actualStartAt: null,\n\s+archivedAt: null,\n\s+id: \{ in: allowed \},\n\s+status: "SCHEDULED",\n\s+timeEntries: \{ none: \{\} \},\n\s+updatedById: null,/);

// --- Reads never generate; rules do not generate on save.
for (const path of ["data/ops/job-occurrences.ts", "data/ops/visit-feed.ts"]) {
  const text = read(path);
  assert.doesNotMatch(text, /job-occurrence-generator|ensureJobOccurrences|generateOccurrences/, path);
  assert.doesNotMatch(text, /\.(create|update|upsert|delete)(Many)?\(/, path);
}
assert.doesNotMatch(read("actions/ops/job-schedule-rules.ts"), /job-occurrence-generator|generateJobOccurrencesForRule/);

// --- One named command: the preview reads, generating writes.
const generator = read("lib/ops/job-occurrence-generator.ts");
const previewBody = generator.slice(generator.indexOf("export const previewOccurrenceGeneration"), generator.indexOf("export const generateOccurrences"));
assert.ok(previewBody.length > 0);
assert.doesNotMatch(previewBody, /persistOccurrences|deleteReplaceableOccurrences/);
assert.match(generator, /const deleted = await deleteReplaceableOccurrences\(range, filters, replaceIds\);\n\s+const plans = await planOccurrenceGeneration\(range, filters\);/);
assert.match(generator, /export const generateOccurrences = async[\s\S]*persistOccurrences\(plan\.rule, plan\.starts, userId\)/);
assert.doesNotMatch(read("lib/ops/job-occurrence-recurrence.ts"), /getGenerationStart|server-only/);
const actions = read("actions/ops/occurrence-generation.ts");
assert.match(actions, /^"use server";/);
assert.equal(actions.match(/await requireAdminSession\(\)/g)?.length, 2);
assert.match(actions, /OccurrenceGenerationSchema\.safeParse\(input\)/);

// --- Buttons in the schedule, the calendar and the job rules; the visit dialog
// loads jobs and employees only while open.
for (const path of [
  "components/ops/schedules/schedule-toolbar.tsx",
  "components/ops/calendar/calendar-month-panel.tsx",
  "components/ops/jobs/job-schedule-rules-panel.tsx",
]) {
  assert.match(read(path), /<GenerateOccurrencesDialog/, path);
}
assert.match(read("components/ops/jobs/job-schedule-rules-panel.tsx"), /scheduleRuleId=\{rule\.id\}/);
const dialog = read("components/ops/jobs/job-occurrence-dialog.tsx");
assert.match(dialog, /useEmployees\(\{ isActive: true \}, open\)/);
assert.match(dialog, /useJobs\(\{ includeArchived: false \}, open\)/);
// Each agenda item mounts a closed dialog: its job's rules load on open too.
assert.match(dialog, /\{ enabled: open && Boolean\(resolvedJobId\) \}/);

console.log("check:occurrence-generation OK");
