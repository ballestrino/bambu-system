import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatModelWithReasoning } from "../lib/agent/usage-format";
import { buildMonthlyCostRows } from "../lib/agent/usage-rows";
import { AGENT_REASONING_LEVELS, REASONING_LABELS } from "../lib/ai/modes";

// Imported by check-agent-sheet.ts. "Costos de IA" by model and reasoning:
// "Luna 6 Extra alto · Medio", with the titles in their own row.

// --- Labels: every reasoning level has one; usage recorded before the
// reasoning column shows only the model.
assert.deepEqual(Object.keys(REASONING_LABELS).sort(), [...AGENT_REASONING_LEVELS].sort());
assert.equal(formatModelWithReasoning("gpt-6-luna", "xhigh"), "Luna 6 Extra alto");
assert.equal(formatModelWithReasoning("openai/gpt-6-luna", "medium"), "Luna 6 Medio");
assert.equal(formatModelWithReasoning("gpt-5.6-luna", "none"), "Luna 5.6 sin razonamiento");
assert.equal(formatModelWithReasoning("gpt-5.6-terra", null), "Terra 5.6");
assert.equal(formatModelWithReasoning("gpt-6-sol", "constructor"), "Sol 6");

// --- Monthly rows: drafts add to the turns of the same model, reasoning and
// mode; titles and another reasoning get their own row; a row is priced when
// any of its records was.
const sums = (costUsd: number, events: number, priced = true) => ({
  inputTokens: 100, outputTokens: 10, cachedInputTokens: 0, cacheWriteTokens: 0, reasoningTokens: 5, costUsd, priced, events,
});
const luna = { modelId: "gpt-6-luna", mode: "medio" };
const rows = buildMonthlyCostRows([
  { ...luna, kind: "TURN", reasoning: "xhigh", ...sums(0.01, 3) },
  { ...luna, kind: "SKILL", reasoning: "xhigh", ...sums(0.002, 1, false) },
  { ...luna, kind: "TITLE", reasoning: "medium", ...sums(0.0001, 3) },
  { ...luna, kind: "TURN", reasoning: "high", ...sums(0.005, 1) },
  { modelId: "gpt-5.6-luna", mode: "bajo", kind: "TITLE", reasoning: null, ...sums(0, 2, false) },
]);
assert.equal(rows.length, 4);
assert.deepEqual(rows[0], {
  ...luna, reasoning: "xhigh", titles: false, eventsByKind: { TURN: 3, SKILL: 1 },
  inputTokens: 200, outputTokens: 20, cachedInputTokens: 0, cacheWriteTokens: 0, reasoningTokens: 10,
  costUsd: 0.012, priced: true, events: 4,
});
assert.deepEqual([rows[1].titles, rows[1].reasoning, rows[1].eventsByKind], [true, "medium", { TITLE: 3 }]);
assert.equal(rows[2].reasoning, "high");
assert.deepEqual([rows[3].titles, rows[3].reasoning, rows[3].priced], [true, null, false]);

// --- Source text: every call records its reasoning, the store saves it, the
// reports group by it, and the migration only adds a nullable column. Un
// checkout con core.autocrlf deja CRLF: se normaliza.
const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
["lib/agent/run.ts", "lib/agent/tools/email.ts", "lib/agent/conversation-title.ts"].forEach((path) =>
  assert.match(source(path), /reasoning: spec\.reasoning,/, path)
);
assert.match(source("lib/agent/usage-store.ts"), /reasoning: group\.reasoning,/);
assert.match(source("data/agent/usage.ts"), /by: \["kind", "modelId", "reasoning"\]/);
assert.match(source("data/agent/usage.ts"), /by: \["modelId", "mode", "reasoning", "kind"\]/);
assert.match(source("prisma/schema.prisma"), /model AgentUsageEvent \{[^}]*\n {2}reasoning {9}String\?\n/);
const migration = source("prisma/migrations/20260923160000_agent_usage_reasoning/migration.sql");
assert.deepEqual(
  migration.split("\n").filter((line) => line.trim() && !line.startsWith("--")),
  ['ALTER TABLE "AgentUsageEvent" ADD COLUMN "reasoning" TEXT;']
);
