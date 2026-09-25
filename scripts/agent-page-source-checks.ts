import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Invariantes de la página del agente que se ven en el código fuente. Lo usa
// check:agent-page. Un checkout con core.autocrlf deja CRLF: se normaliza.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// El texto de una declaración hasta la siguiente: una línea de otra función
// del archivo no cuenta.
const declaration = (text: string, start: string, end: string) => {
  const from = text.indexOf(start);
  assert.ok(from >= 0, start);
  const to = text.indexOf(end, from + start.length);
  return text.slice(from, to < 0 ? undefined : to);
};

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
assert.match(host, /<AgentConversationList[\s\S]*?showBudget[\s\S]*?onDeleted=\{session\.onConversationDeleted\}/);
assert.match(host, /<AgentHistoryDialog[\s\S]*?scope=\{ALL_AGENT_CONVERSATIONS\}/);
// The history dialog of the page shows each row's budget, and the header links
// to the budget of the open conversation.
assert.match(read("components/agent/agent-history-dialog.tsx"), /showBudget=\{scope\.kind === "all"\}/);
assert.match(read("components/agent/agent-page-header.tsx"), /href=\{getBudgetUrl\(budget\.slug\)\}/);

// The URL follows the session with replaceState (no server round trip, no
// remount of the chat, no history entries), and a change from outside (the
// sidebar, back and forward) is followed every time. The rules are pure
// (page-url.ts, tested in check:agent-page).
const url = read("components/agent/hooks/use-agent-page-url.ts");
assert.match(url, /window\.history\.replaceState\(null, "", getAgentPageUrl\(target\)\)/);
assert.match(url, /const target = pageUrlTarget\(session\);/);
assert.match(url, /if \(id !== session\.conversationId\) void session\.openConversation\(id\);/);
assert.match(url, /\} else if \(startsNewWithoutUrlId\(session\)\) \{\n\s+session\.startNew\(\);/);
assert.match(url, /useEffect\(\(\) => followUrl\(urlId\), \[urlId\]\);/);
assert.doesNotMatch(url, /router\.(push|replace)/);

// --- The Sheet opens its conversation in the page, never mid-stream nor
// before the history knows it is saved (it would open a new one).
const openButton = read("components/agent/agent-open-page-button.tsx");
assert.match(openButton, /useChat<AgentUIMessage>\(\{ chat \}\)/);
assert.match(openButton, /status === "submitted" \|\| status === "streaming"/);
assert.match(openButton, /if \(streaming \|\| \(messages\.length > 0 && !persisted\)\) \{/);
assert.match(openButton, /getAgentPageUrl\(persisted \? conversationId : null\)/);
assert.match(read("components/agent/agent-sheet-header.tsx"), /<AgentOpenPageButton/);

// --- History: all conversations (100) or a budget's (50), each with its
// budget, always the user's own; the search looks at the budget name in the
// page, and the list says when it hit the limit.
const data = read("data/agent/conversations.ts");
const listRead = declaration(data, "export const getAgentConversations", "export const");
assert.match(listRead, /const session = await requireAdminSession\(\);[\s\S]*?userId: session\.user\.id,/);
assert.match(listRead, /\.\.\.\(all \? \{\} : \{ budgetId: budgetId \?\? null \}\)/);
assert.match(listRead, /take: conversationListLimit\(all\),/);
assert.match(data, /budget: \{ select: \{ id: true, name: true, slug: true \} \}/);
const list = read("components/agent/agent-conversation-list.tsx");
assert.match(list, /matches\(\[conversation\.title, showBudget \? conversation\.budget\?\.name : null\]\)/);
assert.match(list, /const limit = conversationListLimit\(scope\.kind === "all"\);/);
assert.match(list, /Se muestran las \{limit\} conversaciones más recientes/);
// Deleting from a history that closes meanwhile still starts a new one.
assert.match(read("components/agent/agent-conversation-dialogs.tsx"), /remove\.mutateAsync\(conversation\.id\)\.then\(\n\s+\(\) => \{\n\s+onDeleted\(conversation\.id\);/);
assert.match(read("actions/agent/conversations.ts"), /agentConversationListSchema\.safeParse\(values \?\? \{\}\)/);
assert.match(read("components/agent/actions/agent-reads.action.ts"), /listAgentConversations\(conversationListInput\(scope\)\)/);

// --- The session keeps the conversation read on open, so a conversation
// outside the list (older than the latest 100) is still saved and titled.
const session = read("components/agent/hooks/use-agent-session.ts");
assert.match(session, /\?\? saved;/);
assert.match(session, /const persisted = conversation !== null;/);
// The Sheet keeps its behavior with the scope: create starts a new one (only
// a budget resumes its latest), and deleting the open one starts a new one.
assert.match(session, /if \(scope\.kind !== "budget"\) return startNew\(\);/);
assert.match(session, /if \(deletedId === id\) startNew\(\);/);

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
