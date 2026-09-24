import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { AGENT_TOOL_NAMES } from "../lib/agent/tool-catalog";

// Invariantes que se ven en el código fuente: qué importa cada tool y qué toca
// la migración. Lo usa check:agent-tools.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const toolDir = "lib/agent/tools";
const toolSources = Object.fromEntries(
  readdirSync(join(process.cwd(), toolDir))
    .filter((file) => file.endsWith(".ts"))
    .map((file) => [file, read(`${toolDir}/${file}`)])
);

// --- The tools declared in code are exactly the catalog, so the skills'
// allowlists and the UI labels can't drift from what the model can call.
const declaredTools = Object.values(toolSources).flatMap((source) =>
  [...source.matchAll(/^ {2}(\w+): tool\(\{/gm)].map((match) => match[1])
);
assert.deepEqual([...declaredTools].sort(), [...AGENT_TOOL_NAMES].sort());

// --- Tools never write operational data: no Prisma client and no Server
// Actions. Every read goes through data/ or an existing read helper; the
// propose* tools only save their AgentProposal through lib/agent/proposal-store
// (check:agent-proposals).
Object.entries(toolSources).forEach(([file, source]) => {
  assert.doesNotMatch(source, /from "@\/lib\/db"/, file);
  assert.doesNotMatch(source, /from "@\/actions\//, file);
  assert.match(source, /^import "server-only";/m, file);
});

// --- Visits are read through the agent's own read-only reader. Since feature 9
// no reader generates occurrences, but the agent keeps its own filters.
["operations.ts", "finance.ts", "payroll.ts"].forEach((file) =>
  assert.doesNotMatch(
    toolSources[file],
    /from "@\/data\/ops\/(job-occurrences|visit-feed)"|getJobOccurrences\(|getVisitWeek\(/,
    file
  )
);
assert.doesNotMatch(
  read("data/agent/occurrences.ts"),
  /ensureJobOccurrencesForRange|\.(create|update|upsert|delete)(Many)?\(/
);

// --- draftEmail drafts; it never sends.
assert.doesNotMatch(toolSources["email.ts"], /smtp|nodemailer/);

// --- The route stays thin and on the shared model layer.
const route = read("app/api/agent/chat/route.ts");
assert.doesNotMatch(route, /from "openai"|from "@ai-sdk\/openai"|from "@\/lib\/db"/);
assert.match(route, /requireAdminSession/);
assert.match(route, /agentChatRequestSchema/);

// --- The migration is additive and leaves Chat and Message alone.
const migration = read("prisma/migrations/20260918120000_agent_workspace/migration.sql");
assert.doesNotMatch(migration, /"Chat"|"Message"|DROP /);
assert.doesNotMatch(migration, /ALTER TABLE "(?!Agent)/);
assert.match(migration, /"conversationId"\) REFERENCES "AgentConversation"\("id"\) ON DELETE SET NULL/);
