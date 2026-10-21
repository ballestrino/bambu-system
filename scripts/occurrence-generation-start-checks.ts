import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getMissingStarts } from "../lib/ops/generation-starts";

// A rule start stays taken after its visit is moved, detached or archived:
// generatedStartAt keeps the start the rule gave it. CRLF normalizado.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const at = (iso: string) => new Date(iso);
const monday = at("2026-01-12T12:00:00.000Z");
const wednesday = at("2026-01-14T12:00:00.000Z");
const friday = at("2026-01-16T12:00:00.000Z");
const starts = [monday, wednesday, friday];
const iso = (dates: Date[]) => dates.map((date) => date.toISOString());

assert.deepEqual(iso(getMissingStarts(starts, [])), iso(starts));
// A visit still at its start, generated or created by hand.
assert.deepEqual(iso(getMissingStarts(starts, [{ generatedStartAt: monday, scheduledStartAt: monday }])), iso([wednesday, friday]));
assert.deepEqual(iso(getMissingStarts(starts, [{ generatedStartAt: null, scheduledStartAt: wednesday }])), iso([monday, friday]));
// Moved to another hour or day (also when detached or archived): its original
// start does not come back, and the slot it moved into is taken too.
const moved = { generatedStartAt: monday, scheduledStartAt: at("2026-01-12T15:00:00.000Z") };
assert.deepEqual(iso(getMissingStarts(starts, [moved])), iso([wednesday, friday]));
const movedOntoFriday = { generatedStartAt: wednesday, scheduledStartAt: friday };
assert.deepEqual(iso(getMissingStarts(starts, [movedOntoFriday])), iso([monday]));
// A loose visit elsewhere blocks nothing.
assert.deepEqual(iso(getMissingStarts(starts, [{ generatedStartAt: null, scheduledStartAt: at("2026-01-13T12:00:00.000Z") }])), iso(starts));

// --- Generation stores the start and looks it up in both columns.
const create = read("lib/ops/job-occurrence-generation-create.ts");
assert.match(create, /generatedStartAt: scheduledStartAt,/);
assert.match(create, /OR: \[\n\s+\{ scheduledStartAt: \{ in: starts \} \},\n\s+\{ generatedStartAt: \{ in: starts \} \},\n\s+\],/);
assert.match(create, /return getMissingStarts\(starts, existing\);/);
// Archived visits still count: the lookup does not filter them out.
assert.doesNotMatch(create.slice(create.indexOf("findMissingStarts"), create.indexOf("buildOccurrenceCandidates")), /archivedAt/);

// --- Only generation writes it: no schema accepts it and edits keep it.
for (const path of [
  "schemas/ops/job-occurrence.ts",
  "lib/ops/job-occurrence-patch.ts",
  "actions/ops/job-occurrences.ts",
  "lib/ops/job-occurrence-persistence.ts",
]) {
  assert.doesNotMatch(read(path), /generatedStartAt/, path);
}

// --- The migration only adds the column and its index.
const migration = read("prisma/migrations/20261021120000_occurrence_generated_start/migration.sql");
const statements = migration.split("\n").filter((line) => line.trim() && !line.startsWith("--"));
assert.deepEqual(statements, [
  'ALTER TABLE "JobOccurrence" ADD COLUMN "generatedStartAt" TIMESTAMP(3);',
  'CREATE INDEX "JobOccurrence_jobId_generatedStartAt_idx" ON "JobOccurrence"("jobId", "generatedStartAt");',
]);
