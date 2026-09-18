import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Invariantes de las propuestas que se ven en el código fuente. Lo usa
// check:agent-proposals.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const BUDGET_WRITES = ["createBudget(", "updateBudget(", "duplicateBudget(", "publishOfficialBudget("];

// --- The propose* tools never write budgets during the model turn.
const tools = read("lib/agent/tools/proposals.ts");
[...BUDGET_WRITES, "db.budget."].forEach((text) =>
  assert.ok(!tools.includes(text), `tools/proposals.ts: ${text}`)
);
assert.doesNotMatch(tools, /from "@\/actions\/|from "@\/lib\/db"/);
// The card comes from the saved row: a repeated tool call shows what would run.
assert.match(tools, /const summary = proposal\.summary as ProposalSummary;/);
assert.match(tools, /kind: proposal\.kind,/);

// --- The proposal store only writes AgentProposal (audit goes through
// recordAgentAudit).
const store = read("lib/agent/proposal-store.ts");
const models = [...store.matchAll(/\bdb\.(\w+)\./g)].map((match) => match[1]);
assert.deepEqual([...new Set(models)], ["agentProposal"]);
// Expiring discarded proposals audits only the rows the conditional update changed.
assert.match(store, /where: \{ id: proposal\.id, status: "PENDING" \}[\s\S]*if \(!count\) continue;/);

// --- Confirm: admin session, re-validation, an atomic claim of a live PENDING
// proposal, the four existing actions and an audit event.
const confirm = read("actions/agent/confirm-proposal.ts");
[
  "requireAdminSession()",
  "parseProposalPayload(",
  "checkProposalPreconditions(",
  "updateMany(",
  'status: "PENDING"',
  "expiresAt: { gt: now }",
  'status: "EXECUTING"',
  "auditProposal(",
  ...BUDGET_WRITES,
].forEach((text) => assert.ok(confirm.includes(text), `confirm-proposal.ts: ${text}`));
assert.match(confirm, /^"use server";/);
// Saving re-checks inside updateBudget's own transaction (compare-and-set on
// updatedAt): a concurrent write between the precondition and the save loses.
assert.match(confirm, /updateBudget\(budgetId, newSlug, values, \{ expectedUpdatedAt: baseUpdatedAt \}\)/);
assert.match(confirm, /budgetResult\(result\.budget, result\.budget\.officialBudget\)/);
const updateAction = read("actions/budgets/update-budget.ts");
assert.match(updateAction, /where: \{ id, updatedAt: new Date\(options\.expectedUpdatedAt\) \}/);
assert.match(updateAction, /if \(unchanged\.count !== 1\) throw new BudgetChangedError\(\);/);
// The write is audited before the proposal is closed, and closing tolerates a
// conversation deleted meanwhile.
assert.ok(confirm.indexOf("auditProposal(") < confirm.indexOf('where: { id, status: "EXECUTING" }'));

// --- Reject only moves a live PENDING proposal and writes nothing else.
const reject = read("actions/agent/reject-proposal.ts");
["requireAdminSession()", 'status: "PENDING"', "expiresAt: { gt: now }", 'status: "REJECTED"', "auditProposal("]
  .forEach((text) => assert.ok(reject.includes(text), `reject-proposal.ts: ${text}`));
BUDGET_WRITES.forEach((text) => assert.ok(!reject.includes(text), `reject-proposal.ts: ${text}`));

// --- One slug rule: createBudget and duplicateBudget use the shared helper,
// the same one the proposals use to pre-check the slug.
["actions/budgets/create-budget.ts", "actions/budgets/duplicate-budget.ts"].forEach((file) => {
  const source = read(file);
  assert.match(source, /slugifyBudgetName\(/, file);
  assert.doesNotMatch(source, /replace\(\/\[\^\\w\\s-\]\/g/, file);
});

// --- The budget read brings its categories: without them, saving wipes them.
assert.match(read("data/agent/budgets.ts"), /budgetCategory: \{ select: \{ id: true/);

// --- Retrying or regenerating expires the proposals of the discarded answer,
// and the model sees each proposal's live status in its history.
const turn = read("lib/agent/turn.ts");
const discardAt = turn.indexOf("discardMessagesAfter(");
const expireAt = turn.indexOf("expireDiscardedProposals(");
assert.ok(discardAt > 0 && expireAt > discardAt);
assert.match(turn, /const messages = withLiveProposals\(history, proposals\);/);

// --- The migration is additive: only AgentProposal and its enums.
const migration = read("prisma/migrations/20260918180000_agent_proposals/migration.sql");
assert.doesNotMatch(migration, /DROP |ALTER TABLE "(?!AgentProposal")/);
assert.match(migration, /CREATE UNIQUE INDEX "AgentProposal_conversationId_toolCallId_key"/);
assert.match(migration, /"conversationId"\) REFERENCES "AgentConversation"\("id"\) ON DELETE CASCADE/);
