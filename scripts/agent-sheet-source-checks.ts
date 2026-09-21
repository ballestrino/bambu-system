import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Invariantes del Sheet del agente que se ven en el código fuente. Lo usa
// check:agent-sheet.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const walk = (dir: string): string[] =>
  readdirSync(join(process.cwd(), dir)).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(join(process.cwd(), path)).isDirectory() ? walk(path) : [path];
  });

const sourceFiles = (dir: string) => walk(dir).filter((path) => /\.tsx?$/.test(path));

// --- The legacy budget chat is gone and nothing imports it.
[
  "components/ai/AIChat.tsx",
  "components/ai/AssistantMessageCopyMenu.tsx",
  "app/api/ai-chat/stream/route.ts",
  "data/ai-system-message.ts",
  "actions/save-chat.ts",
  "actions/upload-chat-image.ts",
].forEach((path) => assert.ok(!existsSync(join(process.cwd(), path)), `${path} sigue existiendo`));
["app", "components", "actions", "data", "lib"].flatMap(sourceFiles).forEach((path) =>
  assert.doesNotMatch(
    read(path),
    /from "@\/(components\/ai\/|actions\/save-chat|actions\/upload-chat-image|data\/ai-system-message)|["'`]\/api\/ai-chat/,
    path
  )
);

// --- Entry points: the detail passes the saved budget; create reads the form
// when sending, not on every keystroke.
assert.match(
  read("components/budgets/budget-details/BudgetView.tsx"),
  /<AgentSheetHost budgetId=\{budget\.id\} budgetSlug=\{budget\.slug\} budgetName=\{budget\.name\} \/>/
);
const createHeader = read("components/budgets/create-budget/Header.tsx");
assert.match(createHeader, /getFormValues=\{\(\) => form\.getValues\(\)\}/);
assert.doesNotMatch(createHeader, /form\.watch\(\)/);

// --- The client never imports server-only code at runtime: no data/ readers,
// no Prisma, and lib modules marked server-only only through `import type`.
const serverOnly = sourceFiles("lib")
  .filter((path) => read(path).includes('import "server-only"'))
  .map((path) => `@/${path.replace(/\.tsx?$/, "").replace(/\/index$/, "")}`);
const agentFiles = sourceFiles("components/agent");
agentFiles.forEach((path) => {
  const text = read(path);
  assert.doesNotMatch(text, /from "@\/data\/|from "@\/lib\/db"|"server-only"/, path);
  [...text.matchAll(/^import\s+(?!type\s)[\s\S]*?\sfrom\s+"([^"]+)";/gm)].forEach(([, from]) =>
    assert.ok(!serverOnly.includes(from), `${path} importa ${from} en runtime`)
  );
  assert.ok(text.trimEnd().split("\n").length <= 200, `${path} supera las 200 líneas`);
});

// --- One transport for every conversation; mode, skill and context travel
// with each send or regenerate (read at send time), and an expired session is
// detected instead of parsing the login page.
const transport = read("components/agent/agent-transport.ts");
["api: AGENT_CHAT_API", "prepareSendMessagesRequest", "response.redirected", "buildAgentChatBody("].forEach(
  (text) => assert.ok(transport.includes(text), `agent-transport.ts: ${text}`)
);
const chatHook = read("components/agent/hooks/use-agent-chat.ts");
assert.equal(chatHook.match(/body: requestOptions\(/g)?.length, 2);
assert.match(chatHook, /context: getContext\(\)/);

// --- The Chat instance lives in the host session (closing the Sheet keeps
// it) and switching conversations stops the previous stream.
assert.match(read("components/agent/agent-sheet-host.tsx"), /useAgentSession\(\{ budgetId: budgetId \?\? null \}\)/);
const session = read("components/agent/hooks/use-agent-session.ts");
assert.match(session, /useEffect\(\(\) => \(\) => void chat\?\.stop\(\), \[chat\]\);/);
assert.match(session, /if \(request !== requestRef\.current\) return;/);

// --- A stopped answer stays marked after a reload: the cut step reports no
// usage, so the line says so instead of showing nothing.
assert.match(read("app/api/agent/chat/route.ts"), /stopped: isAborted \|\| request\.signal\.aborted/);
assert.match(read("lib/agent/turn.ts"), /input\.stopped \? \{ stopped: true \}/);
assert.match(read("components/agent/agent-message.tsx"), /notice === "stopped" \|\| message\.metadata\?\.stopped/);

// --- Composer: Enter sends; Shift+Enter and IME composition do not; Stop
// while streaming.
const composer = read("components/agent/agent-composer.tsx");
assert.match(composer, /event\.key !== "Enter" \|\| event\.shiftKey \|\| event\.nativeEvent\.isComposing/);
assert.match(composer, /aria-label="Detener respuesta"/);

// --- Proposal cards read the live state, show a stale EXECUTING as unknown,
// accept both confirm answers and refresh budgets and official budgets.
const card = read("components/agent/cards/agent-proposal-card.tsx");
assert.match(card, /proposals\?\.get\(data\.proposalId\)/);
assert.match(card, /getDisplayStatus\(live, data\.status\)/);
assert.match(read("components/agent/cards/agent-proposal-status.tsx"), /live\.unknownOutcome \? "UNKNOWN"/);
assert.match(read("components/agent/actions/agent-writes.action.ts"), /readConfirmResponse\(await confirmAgentProposal\(proposalId\)\)/);
const mutations = read("components/agent/hooks/use-agent-proposal-mutations.ts");
['queryKey: ["budgets"]', 'queryKey: ["budget"]', "queryKey: officialBudgetKeys.all", "agentKeys.proposals(conversationId)"].forEach(
  (text) => assert.ok(mutations.includes(text), `use-agent-proposal-mutations.ts: ${text}`)
);

// --- Markdown: numbered lists keep their start ("2." after a list) and table
// cells their GFM alignment; single line breaks are kept.
const markdown = read("components/agent/agent-markdown.tsx");
["<ol start={start}", "<th style={style}", "<td style={style}", "withHardLineBreaks(cleanChatContent(content))"].forEach(
  (text) => assert.ok(markdown.includes(text), `agent-markdown.tsx: ${text}`)
);

// --- Unpriced usage never shows as US$ 0,00: a group whose costs are all NULL
// is "sin precio" in the cost report.
assert.match(read("data/agent/usage.ts"), /priced: _sum\.costUsd !== null/);
assert.match(read("components/agent/agent-cost-sections.tsx"), /row\.priced \? formatUsd\(row\.costUsd\) :/);

// --- The email card copies through the shared formatter (email, WhatsApp).
assert.match(read("components/agent/cards/agent-copy-menu.tsx"), /getChatCopyPayload\(content, format\)/);

// --- Every card a tool can return has a renderer (the business profile only
// gets its chip).
const toolCards = new Set(
  sourceFiles("lib/agent/tools").flatMap((path) =>
    [...read(path).matchAll(/card: "([a-z-]+)" as const/g)].map((match) => match[1])
  )
);
const cardSwitch = read("components/agent/agent-tool-card.tsx");
[...toolCards]
  .filter((name) => name !== "business")
  .forEach((name) => assert.ok(cardSwitch.includes(`case "${name}":`), `sin tarjeta para "${name}"`));
assert.ok(toolCards.size >= 10);

// --- Feature 7 (split the old chat) is superseded by this feature.
const features = JSON.parse(read("feature_list.json")).features as { id: number; status: string; description: string }[];
const legacyChat = features.find((feature) => feature.id === 7);
assert.equal(legacyChat?.status, "done");
assert.match(legacyChat?.description ?? "", /^Superseded by feature 41/);
