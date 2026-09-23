import assert from "node:assert/strict";

import "./agent-sheet-source-checks";
import { capitalizeFirst } from "../components/agent/format";
import { buildAgentChatBody, readAgentError, SESSION_EXPIRED_MESSAGE } from "../lib/agent/chat-request";
import { sanitizeFormContextValues } from "../lib/agent/form-context";
import { withHardLineBreaks } from "../lib/agent/markdown-breaks";
import type { AgentUIMessage } from "../lib/agent/messages";
import { formatProposalsForPrompt } from "../lib/agent/proposal-context";
import {
  canActOnProposal,
  EXECUTING_UNKNOWN_AFTER_MS,
  getDisplayStatus,
  hasRunningProposal,
  hasUnknownOutcome,
  readConfirmResponse,
  savedSlugRedirect,
} from "../lib/agent/proposal-outcome";
import { serializeProposal, type AgentProposalStatus, type ProposalSummary } from "../lib/agent/proposals";
import type { TurnUsageSummary } from "../lib/agent/usage-collector";
import { formatModelLabel, formatTokenCount, formatUsageCost, formatUsageLine } from "../lib/agent/usage-format";
import { agentBudgetContextSchema, agentChatRequestSchema } from "../schemas/agent";

// --- The Sheet sends only the last user message plus mode, skill and context,
// and the body passes the route schema as is (submit, regenerate, form).
const user = (id: string, text: string): AgentUIMessage => ({ id, role: "user", parts: [{ type: "text", text }] });
const assistant: AgentUIMessage = { id: "msg-a1", role: "assistant", parts: [{ type: "text", text: "Hola" }] };
const history = [user("user_1_abcdef", "Hola"), assistant, user("user_2_abcdef", "Ajustá el margen a 40 %")];
const saved = { mode: "medio", skill: "presupuestos", context: { kind: "saved", budgetId: "budget_1" } } as const;

const submit = buildAgentChatBody({ id: "conv_12345678", messages: history, trigger: "submit-message", messageId: undefined, options: saved });
assert.deepEqual(submit.message, { id: "user_2_abcdef", role: "user", parts: [{ type: "text", text: "Ajustá el margen a 40 %" }] });
const parsedSubmit = agentChatRequestSchema.parse(JSON.parse(JSON.stringify(submit)));
assert.deepEqual([parsedSubmit.mode, parsedSubmit.skill, parsedSubmit.trigger], ["medio", "presupuestos", "submit-message"]);
assert.deepEqual(parsedSubmit.context, saved.context);

// Regenerate: the SDK drops the answer and resends the same user message.
const regenerate = buildAgentChatBody({ id: "conv_12345678", messages: history, trigger: "regenerate-message", messageId: undefined, options: { mode: "alto", skill: "general" } });
assert.equal(agentChatRequestSchema.parse(JSON.parse(JSON.stringify(regenerate))).trigger, "regenerate-message");
// Non-text parts never travel (the route only accepts text).
const withFile = { ...user("user_3_abcdef", "Mirá"), parts: [{ type: "file", mediaType: "image/png", url: "data:," }, { type: "text", text: "Mirá" }] } as AgentUIMessage;
assert.deepEqual(buildAgentChatBody({ id: "conv_12345678", messages: [withFile], trigger: "submit-message", messageId: undefined, options: saved }).message.parts, [{ type: "text", text: "Mirá" }]);
assert.throws(() => buildAgentChatBody({ id: "conv_12345678", messages: [assistant], trigger: "submit-message", messageId: undefined, options: saved }));

// --- Unsaved form values: invalid fields (half-typed numbers, 0 employees) and
// unknown keys stay out, so one bad field does not turn the turn into a 400.
const form = sanitizeFormContextValues({
  name: "Oficina Centro", visits: "3", employees: "", hours_per_visit: Number.NaN,
  revenue_percent: 40, visit_type: "week", notAField: "x", categoryIds: ["cat_1"],
});
assert.deepEqual(form, { name: "Oficina Centro", visits: 3, revenue_percent: 40, visit_type: "week", categoryIds: ["cat_1"] });
assert.ok(agentBudgetContextSchema.safeParse({ kind: "form", values: form }).success);
const formBody = buildAgentChatBody({ id: "conv_12345678", messages: history, trigger: "submit-message", messageId: undefined, options: { mode: "bajo", skill: "general", context: { kind: "form", values: form } } });
assert.ok(agentChatRequestSchema.safeParse(JSON.parse(JSON.stringify(formBody))).success);
assert.equal(agentChatRequestSchema.safeParse({ ...submit, context: { kind: "form", values: { employees: 0 } } }).success, false);

// --- Errors: the route's { error } JSON and the stream's Spanish text show as
// they are; HTML, SDK internals and network failures get a clear message.
const apiError = (statusCode: number, message: string) => Object.assign(new Error(message), { statusCode });
assert.equal(readAgentError(apiError(403, '{"error":"Necesitás iniciar sesión como administrador"}')), "Necesitás iniciar sesión como administrador");
assert.match(readAgentError(apiError(504, "<html>An error occurred</html>")) ?? "", /tardó demasiado/);
assert.match(readAgentError(apiError(500, "Failed to fetch the chat response.")) ?? "", /no pudo responder/);
assert.match(readAgentError(new TypeError("Failed to fetch")) ?? "", /conectar/);
assert.equal(readAgentError(new Error("Falta configurar OPENAI_API_KEY")), "Falta configurar OPENAI_API_KEY");
assert.equal(readAgentError(new Error(SESSION_EXPIRED_MESSAGE)), SESSION_EXPIRED_MESSAGE);
assert.match(readAgentError(Object.assign(new Error("Unexpected token <"), { name: "AI_JSONParseError" })) ?? "", /no pudo responder/);
assert.equal(readAgentError(undefined), null);

// --- The usage line: "Terra · Medio · 3,2k tokens · US$ 0,03", and never an
// invented price.
const tokens = { inputTokens: 2400, outputTokens: 800, cachedInputTokens: 0, cacheWriteTokens: 0, reasoningTokens: 300, total: 3200 };
const usage: TurnUsageSummary = { modelId: "gpt-5.6-terra", tokens, costUsd: 0.03, priced: true };
// Intl separa "US$" del número con un espacio duro.
const plain = (text: string) => text.replace(/\s/g, " ");
assert.equal(plain(formatUsageLine(usage, "medio")), "Terra · Medio · 3,2k tokens · US$ 0,03");
assert.equal(formatModelLabel("openai/gpt-5.6-sol"), "Sol");
assert.equal(formatModelLabel("anthropic/claude-sonnet-5"), "claude-sonnet-5");
assert.deepEqual([850, 3250, 999_960, 1_500_000].map(formatTokenCount), ["850", "3,3k", "1M", "1,5M"]);
assert.equal(formatUsageCost({ costUsd: null, priced: false }), "precio no configurado");
assert.equal(plain(formatUsageCost({ costUsd: 0.02, priced: false })), "US$ 0,02 + precio no configurado");

// --- Markdown keeps the model's single line breaks (an email or a price list
// reads differently without them), except inside code blocks.
assert.equal(withHardLineBreaks("Opción 1\nPrecio: $ 1\n\nNota"), "Opción 1  \nPrecio: $ 1\n\nNota");
assert.equal(withHardLineBreaks("```\na\nb\n```\nfin"), "```\na\nb\n```\nfin");
assert.equal(capitalizeFirst("setiembre de 2026"), "Setiembre de 2026");

// --- A proposal left EXECUTING by a server cut shows as an unknown outcome
// once no function can still be running, in the DTO and in the prompt.
const updatedAt = new Date("2026-09-21T12:00:00.000Z");
const executing = { status: "EXECUTING" as const, updatedAt };
assert.equal(hasUnknownOutcome(executing, new Date(updatedAt.getTime() + EXECUTING_UNKNOWN_AFTER_MS - 1)), false);
assert.equal(hasUnknownOutcome(executing, new Date(updatedAt.getTime() + EXECUTING_UNKNOWN_AFTER_MS)), true);
assert.equal(hasUnknownOutcome({ status: "CONFIRMED", updatedAt }, new Date(updatedAt.getTime() + 60 * EXECUTING_UNKNOWN_AFTER_MS)), false);
assert.ok(EXECUTING_UNKNOWN_AFTER_MS > 300_000, "más que el máximo de una función de Vercel");

const summary = { title: "Guardar cambios en “Limpieza Norte”", changes: [] } as unknown as ProposalSummary;
const row = {
  id: "prop_1", kind: "UPDATE_BUDGET" as const, status: "EXECUTING" as const, summary, result: null, error: null,
  toolCallId: "call_1", conversationId: "conv_1", expiresAt: new Date(updatedAt.getTime() + 86_400_000),
  resolvedAt: null, createdAt: updatedAt, updatedAt,
};
const stale = serializeProposal(row, new Date(updatedAt.getTime() + EXECUTING_UNKNOWN_AFTER_MS));
assert.deepEqual([stale.status, stale.unknownOutcome, stale.updatedAt], ["EXECUTING", true, updatedAt.toISOString()]);
assert.equal(serializeProposal(row, updatedAt).unknownOutcome, false);
assert.match(formatProposalsForPrompt([stale]), /resultado desconocido/);
assert.doesNotMatch(formatProposalsForPrompt([{ ...stale, unknownOutcome: false }]), /resultado desconocido/);

// --- Confirm answers { success, proposal } or, when the conversation was
// deleted mid-way, { success, result } without proposal: both work.
const result = { label: "Limpieza Norte", url: "/dashboard/budgets/budget/limpieza-norte", budgetId: "budget_1", slug: "limpieza-norte", officialBudgetId: null, officialVersion: null };
assert.deepEqual(readConfirmResponse({ success: "Propuesta confirmada", proposal: { result } }), { ok: true, message: "Propuesta confirmada", result });
assert.deepEqual(readConfirmResponse({ success: "Propuesta confirmada", result }), { ok: true, message: "Propuesta confirmada", result });
assert.deepEqual(readConfirmResponse({ error: "La propuesta venció.", proposal: { result: null } }), { ok: false, error: "La propuesta venció." });
assert.deepEqual(readConfirmResponse({ error: "No autorizado" }), { ok: false, error: "No autorizado" });

// --- The card's rules: the live status wins over the tool output (which says
// PENDING forever) and a stale EXECUTING is unknown; only a live pending one
// can be confirmed or rejected, one at a time; only a running one is polled;
// and only the open budget's new address is followed (a copy is not).
const live = (status: AgentProposalStatus, unknownOutcome = false) => ({ status, unknownOutcome });
assert.equal(getDisplayStatus(undefined, "PENDING"), "PENDING");
assert.equal(getDisplayStatus(live("CONFIRMED"), "PENDING"), "CONFIRMED");
assert.equal(getDisplayStatus(live("EXECUTING", true), "PENDING"), "UNKNOWN");
assert.equal(canActOnProposal("PENDING", live("PENDING"), null), true);
assert.equal(canActOnProposal("PENDING", undefined, null), false);
assert.equal(canActOnProposal("PENDING", live("PENDING"), "prop_2"), false);
assert.equal(canActOnProposal("UNKNOWN", live("EXECUTING", true), null), false);
assert.equal(hasRunningProposal([live("PENDING"), live("EXECUTING")]), true);
assert.equal(hasRunningProposal([live("EXECUTING", true), live("CONFIRMED")]), false);
assert.equal(hasRunningProposal(undefined), false);
const open = { budgetId: "budget_1", budgetSlug: "ln-2026" };
assert.equal(savedSlugRedirect(result, open), "limpieza-norte");
assert.equal(savedSlugRedirect(result, { ...open, budgetSlug: "limpieza-norte" }), null);
assert.equal(savedSlugRedirect({ ...result, budgetId: "budget_2" }, open), null);
assert.equal(savedSlugRedirect(result, { budgetId: null, budgetSlug: null }), null);
assert.equal(savedSlugRedirect(null, open), null);

console.log("Agent sheet checks passed");
