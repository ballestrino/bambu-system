import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Invariantes de las propuestas de visitas que se ven en el código fuente. Lo
// usa check:agent-visits. CRLF normalizado.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// --- The tools only save proposals: no Prisma, no Server Actions, no visit
// writes during the model turn.
const tools = read("lib/agent/tools/visits.ts");
assert.match(tools, /^import "server-only";/);
assert.doesNotMatch(tools, /from "@\/lib\/db"|from "@\/actions\/|updateJobOccurrence\(|archiveJobOccurrence\(/);
assert.match(tools, /return saveProposal\(ctx, toolCallId, buildUpdateVisitProposal\(/);
assert.match(tools, /return saveProposal\(ctx, toolCallId, buildArchiveVisitProposal\(/);
assert.ok(tools.indexOf("buildCreateVisitsProposal({") < tools.indexOf("return saveProposal(ctx, toolCallId, built);"));

// --- The executor is server-only (not a Server Action endpoint), re-checks
// the preconditions before writing and is only reached from confirm.
const executor = read("lib/agent/visit-proposal-execute.ts");
assert.match(executor, /^import "server-only";/);
assert.doesNotMatch(executor, /^"use server";/m);
const checkAt = executor.indexOf("checkVisitProposalPreconditions(proposal");
assert.ok(checkAt > 0);
assert.ok(checkAt < executor.indexOf("updateJobOccurrence(occurrenceId"));
assert.ok(checkAt < executor.indexOf("archiveJobOccurrence(occurrenceId"));
const createCheckAt = executor.indexOf("checkCreateVisitsPreconditions(payload");
assert.ok(createCheckAt > 0 && createCheckAt < executor.indexOf("createJobOccurrences(payload)"));

// --- The batch writes every visit or none: one array transaction, SCHEDULED,
// without a rule or generatedStartAt.
assert.match(read("lib/ops/job-occurrence-persistence.ts"), /db\.\$transaction\(\n    rows\.map\(/);
const batch = read("actions/ops/job-occurrence-batch.ts");
assert.match(batch, /^"use server";/);
assert.match(batch, /await requireAdminSession\(\);/);
assert.match(batch, /assertJobExists\(jobId\), assertOccurrenceEmployeesExist\(employeeIds\)/);
assert.match(batch, /status: "SCHEDULED" as const/);
assert.doesNotMatch(batch, /scheduleRuleId:|generatedStartAt:/);
assert.doesNotMatch(batch, /createJobOccurrence\(/);
const importers = (dir: string): string[] =>
  readdirSync(join(process.cwd(), dir)).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(join(process.cwd(), path)).isDirectory()) return importers(path);
    return /\.tsx?$/.test(name) && read(path).includes("@/lib/agent/visit-proposal-execute") ? [path] : [];
  });
assert.deepEqual(["actions", "app", "components", "data", "lib"].flatMap(importers), ["actions/agent/confirm-proposal.ts"]);

// --- Confirm keeps its claim and audit, and sends visit proposals to the
// executor before the budget preconditions.
const confirm = read("actions/agent/confirm-proposal.ts");
const dispatchAt = confirm.indexOf("if (isVisitProposal(proposal)) return await executeVisitProposal(proposal);");
assert.ok(dispatchAt > confirm.indexOf("parseProposalPayload(stored.kind, stored.payload)"));
assert.ok(dispatchAt < confirm.indexOf("checkProposalPreconditions(proposal, state)"));

// --- Readers never write.
["data/agent/occurrences.ts", "data/agent/visit-targets.ts", "data/ops/visit-payroll-status.ts"].forEach((path) =>
  assert.doesNotMatch(read(path), /\.(create|update|upsert|delete)(Many)?\(/, path)
);
assert.match(read("lib/agent/tools/operations.ts"), /input\.day \? getVisitExactDateRange\(input\.day\) : getZonedMonthRange\(month\)/);

// --- The migrations only add the proposal kinds.
const migration = read("prisma/migrations/20261021150000_agent_visit_proposals/migration.sql");
assert.deepEqual(
  migration.split("\n").filter((line) => line.trim() && !line.startsWith("--")),
  [`ALTER TYPE "AgentProposalKind" ADD VALUE 'UPDATE_VISIT';`, `ALTER TYPE "AgentProposalKind" ADD VALUE 'ARCHIVE_VISIT';`]
);
assert.deepEqual(
  read("prisma/migrations/20261021180000_agent_visit_batch_create/migration.sql")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("--")),
  [`ALTER TYPE "AgentProposalKind" ADD VALUE 'CREATE_VISITS';`]
);

// --- New files stay within the 200-line limit.
[
  "lib/agent/tools/visits.ts",
  "lib/agent/visit-create-builder.ts",
  "actions/ops/job-occurrence-batch.ts",
  "schemas/ops/job-occurrence-batch.ts",
  "components/agent/cards/agent-proposal-items.tsx",
  "lib/agent/visit-format.ts",
  "lib/agent/visit-proposal-execute.ts",
  "lib/agent/visit-proposal-preconditions.ts",
  "lib/agent/visit-proposals.ts",
  "lib/agent/visit-time.ts",
  "lib/agent/visit-update-builder.ts",
  "lib/agent/visit-warnings.ts",
  "schemas/agent-visit-proposals.ts",
  "schemas/agent-visit-tools.ts",
  "data/agent/occurrences.ts",
  "data/agent/visit-targets.ts",
  "actions/agent/confirm-proposal.ts",
  "lib/agent/proposals.ts",
  "schemas/agent-tools.ts",
].forEach((path) => assert.ok(read(path).split("\n").length <= 201, `${path} has more than 200 lines`));
