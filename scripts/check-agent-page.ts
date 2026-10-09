import assert from "node:assert/strict";

import { generateId } from "ai";

import "./agent-conversation-groups-checks";
import "./agent-page-source-checks";
import { isAgentClientId } from "../lib/agent/client-id";
import {
  ALL_AGENT_CONVERSATIONS,
  budgetConversationScope,
  conversationListInput,
  conversationListLimit,
  conversationScopeKey,
  pageBudgetContext,
  pageContextLabel,
} from "../lib/agent/conversation-scope";
import {
  AGENT_PAGE_PATH,
  getAgentPageUrl,
  pageUrlTarget,
  readConversationParam,
  startsNewWithoutUrlId,
} from "../lib/agent/page-url";
import {
  agentBudgetContextSchema,
  agentChatRequestSchema,
  agentClientIdSchema,
  agentConversationListSchema,
} from "../schemas/agent";

// --- Scopes: the budget Sheet lists its budget, the create Sheet the
// conversations without a budget (budgetId null, not "any"), and the page all.
const budget = budgetConversationScope("budget_1");
const noBudget = budgetConversationScope(null);
assert.deepEqual(budget, { kind: "budget", budgetId: "budget_1" });
assert.deepEqual(noBudget, { kind: "no-budget" });
assert.deepEqual(conversationListInput(budget), { budgetId: "budget_1" });
assert.deepEqual(conversationListInput(noBudget), { budgetId: null });
assert.deepEqual(conversationListInput(ALL_AGENT_CONVERSATIONS), { all: true });
[budget, noBudget, ALL_AGENT_CONVERSATIONS].forEach((scope) => {
  const parsed = agentConversationListSchema.safeParse(conversationListInput(scope));
  assert.ok(parsed.success, scope.kind);
  assert.deepEqual(parsed.data, conversationListInput(scope));
});
assert.equal(agentConversationListSchema.safeParse({ all: "true" }).success, false);
// Each scope has its own cache entry.
const keys = [budget, noBudget, ALL_AGENT_CONVERSATIONS].map(conversationScopeKey);
assert.deepEqual(keys, ["budget_1", "sin-presupuesto", "todas"]);

// --- Context on the page: a conversation of a saved budget keeps talking
// about it on every turn; the rest go without context (the create form does
// not exist there).
const linked = { id: "budget_1", name: "Limpieza Norte", slug: "limpieza-norte" };
const context = pageBudgetContext(linked);
assert.deepEqual(context, { kind: "saved", budgetId: "budget_1" });
assert.ok(agentBudgetContextSchema.safeParse(context).success);
const turn = { id: "conv_12345678", message: { id: "user_1_abcdef", role: "user", parts: [{ type: "text", text: "Hola" }] }, mode: "alto", skill: "general" };
assert.deepEqual(agentChatRequestSchema.parse({ ...turn, context }).context, context);
assert.equal(agentChatRequestSchema.parse({ ...turn, context: pageBudgetContext(null) }).context, undefined);
assert.equal(pageBudgetContext(null), undefined);
assert.equal(pageBudgetContext(undefined), undefined);
assert.equal(pageContextLabel(linked), "Presupuesto: Limpieza Norte");
assert.equal(pageContextLabel(null), "Sin presupuesto");

// --- The page address: ?conversacion= with a valid id; anything else opens a
// new conversation instead of an error.
assert.equal(AGENT_PAGE_PATH, "/dashboard/agent");
assert.equal(getAgentPageUrl(null), "/dashboard/agent");
assert.equal(getAgentPageUrl("abc12345XYZ"), "/dashboard/agent?conversacion=abc12345XYZ");
assert.equal(readConversationParam("abc12345XYZ"), "abc12345XYZ");
["", "short", "../../etc/x", "a b c d e f", "x".repeat(65), "<script>1</script>", null, undefined].forEach((value) =>
  assert.equal(readConversationParam(value), null, String(value))
);
// Same rule as the route, and the ids the client generates pass it.
["abc12345XYZ", "msg-1234_abcd", "short", "a/b/c/d/e/f", "x".repeat(64), "x".repeat(65)].forEach((value) =>
  assert.equal(isAgentClientId(value), agentClientIdSchema.safeParse(value).success, value)
);
for (let index = 0; index < 50; index += 1) {
  const id = generateId();
  assert.equal(readConversationParam(new URL(getAgentPageUrl(id), "http://localhost").searchParams.get("conversacion")), id);
}

// --- The address and the session: without an id in the address a new one
// starts, unless the session is already a new, ready, unsaved one (maybe in its
// first turn); also from the "not found" screen or while another one opens.
// The address shows a ready saved one, the one that failed to open (a reload
// shows the same error), and stays as it is while opening.
const at = (status: "idle" | "loading" | "ready" | "error", conversationId: string | null, persisted: boolean) =>
  ({ state: { status }, conversationId, persisted });
assert.equal(startsNewWithoutUrlId(at("idle", null, false)), true);
assert.equal(startsNewWithoutUrlId(at("ready", "new000001", false)), false);
assert.equal(startsNewWithoutUrlId(at("ready", "convA0001", true)), true);
assert.equal(startsNewWithoutUrlId(at("error", "missing01", false)), true);
assert.equal(startsNewWithoutUrlId(at("loading", "convOLD01", false)), true);
assert.equal(pageUrlTarget(at("ready", "convA0001", true)), "convA0001");
assert.equal(pageUrlTarget(at("ready", "new000001", false)), null);
assert.equal(pageUrlTarget(at("error", "convB0001", true)), "convB0001");
assert.equal(pageUrlTarget(at("loading", "convOLD01", false)), undefined);
assert.equal(pageUrlTarget(at("idle", null, false)), undefined);
// The page lists the latest 100 and a Sheet the latest 50 of its budget.
assert.deepEqual([conversationListLimit(true), conversationListLimit(false), conversationListLimit(undefined)], [100, 50, 50]);

console.log("Agent page checks passed");
