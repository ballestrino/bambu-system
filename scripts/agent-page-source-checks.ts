import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Invariantes de la página del agente que se ven en el código fuente. Lo usa
// check:agent-page.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const lines = (path: string) => read(path).trimEnd().split("\n").length;

// --- The route lives under the admin-only private layout and wraps the host
// in Suspense (it reads ?conversacion= with useSearchParams).
const pagePath = "app/(private)/dashboard/agent/page.tsx";
assert.ok(existsSync(join(process.cwd(), pagePath)), `${pagePath} no existe`);
const page = read(pagePath);
assert.match(page, /<Suspense fallback=\{<AgentPageFallback \/>\}>\s*<AgentPageHost \/>\s*<\/Suspense>/);
assert.match(read("app/(private)/layout.tsx"), /session\?\.user\.role !== 'ADMIN'/);

// --- Sidebar entry, active on the route.
const sidebar = read("components/dashboard/dashboard-sidebar.tsx");
assert.match(sidebar, /title: "Agente",[\s\S]*?url: AGENT_PAGE_PATH,[\s\S]*?match: \(pathname: string\) => pathname\.startsWith\(AGENT_PAGE_PATH\)/);
// The sidebar is on every page: the path comes from a module without zod.
assert.doesNotMatch(read("lib/agent/page-url.ts"), /from "@\/schemas\//);
assert.doesNotMatch(read("lib/agent/client-id.ts"), /^import /m);

// --- The page host: every conversation, the URL in both directions, and the
// saved budget of the open conversation as context.
const host = read("components/agent/agent-page-host.tsx");
assert.match(host, /useAgentSession\(\{ scope: ALL_AGENT_CONVERSATIONS \}\)/);
assert.match(host, /useAgentPageUrl\(session\)/);
assert.match(host, /getContext=\{\(\) => pageBudgetContext\(budget\)\}/);
assert.match(host, /const budget = session\.conversation\?\.budget \?\? null;/);
assert.match(host, /<AgentConversationList[\s\S]*?showBudget/);
assert.match(host, /<AgentHistoryDialog[\s\S]*?scope=\{ALL_AGENT_CONVERSATIONS\}/);

// The URL follows the session with replaceState (no server round trip, no
// remount of the chat, no history entries) and only for a ready, saved one.
const url = read("components/agent/hooks/use-agent-page-url.ts");
assert.match(url, /window\.history\.replaceState\(null, "", getAgentPageUrl\(target\)\)/);
assert.match(url, /session\.state\.status === "ready" \? \(session\.persisted \? session\.conversationId : null\) : undefined/);
assert.match(url, /if \(id !== session\.conversationId\) void session\.openConversation\(id\);/);
assert.match(url, /useEffectEvent/);
assert.doesNotMatch(url, /router\.(push|replace)/);

// --- The Sheet opens its conversation in the page, never mid-stream.
const openButton = read("components/agent/agent-open-page-button.tsx");
assert.match(openButton, /useChat<AgentUIMessage>\(\{ chat \}\)/);
assert.match(openButton, /status === "submitted" \|\| status === "streaming"/);
assert.match(openButton, /getAgentPageUrl\(persisted \? conversationId : null\)/);
assert.match(read("components/agent/agent-sheet-header.tsx"), /<AgentOpenPageButton/);

// --- History: all conversations (100) or a budget's (50), each with its budget.
const data = read("data/agent/conversations.ts");
assert.match(data, /\.\.\.\(all \? \{\} : \{ budgetId: budgetId \?\? null \}\)/);
assert.match(data, /take: all \? 100 : 50/);
assert.match(data, /budget: \{ select: \{ id: true, name: true, slug: true \} \}/);
assert.match(read("actions/agent/conversations.ts"), /agentConversationListSchema\.safeParse\(values \?\? \{\}\)/);
assert.match(read("components/agent/actions/agent-reads.action.ts"), /listAgentConversations\(conversationListInput\(scope\)\)/);

// --- The session keeps the conversation read on open, so a conversation
// outside the list (older than the latest 100) is still saved and titled.
const session = read("components/agent/hooks/use-agent-session.ts");
assert.match(session, /\?\? saved;/);
assert.match(session, /const persisted = conversation !== null;/);

// --- Size and harness state.
[
  pagePath,
  "components/agent/agent-page-host.tsx",
  "components/agent/agent-page-header.tsx",
  "components/agent/agent-conversation-list.tsx",
  "components/agent/hooks/use-agent-page-url.ts",
  "lib/agent/conversation-scope.ts",
  "lib/agent/page-url.ts",
].forEach((path) => assert.ok(lines(path) <= 200, `${path} supera las 200 líneas`));
const features = JSON.parse(read("feature_list.json")).features as { id: number; name: string }[];
assert.equal(features.find((feature) => feature.id === 42)?.name, "agent_page");
