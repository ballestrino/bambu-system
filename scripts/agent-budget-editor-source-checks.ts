import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Invariantes del editor de presupuestos del agente que se ven en el código
// fuente. Lo usa check:agent-budget-editor. Un checkout con core.autocrlf deja
// CRLF: se normaliza para que las regex con \n valgan igual.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// --- The three budget tools return values for the UI and hide them from the model.
const calculations = read("lib/agent/tools/calculations.ts");
assert.equal(calculations.match(/toModelOutput: hideFromModel\("values"\)/g)?.length, 2);
assert.match(calculations, /grounding,\n\s+values,\n/);
assert.match(calculations, /values: solved\.values,/);
const proposalTools = read("lib/agent/tools/proposals.ts");
assert.equal(proposalTools.match(/toModelOutput: hideFromModel\("values"\)/g)?.length, 1);
// The values come from the stored row, like the rest of the card (also when
// the same call arrives twice).
assert.match(proposalTools, /const values = readCreateValues\(proposal\);[\s\S]*?\.\.\.\(values \? \{ values \} : \{\}\),/);
// The history the model reads goes through the same tools (and toModelOutput).
assert.match(read("lib/agent/run.ts"), /convertToModelMessages\(input\.messages, \{\n\s+tools,/);

// --- Saving: admin session, validated input, a tool call of a budget in a
// conversation of the user, the slug pre-check, a revised or new proposal of
// that call, and the existing confirmation.
const save = read("actions/agent/save-budget.ts");
assert.match(save, /^"use server";/);
[
  "await requireAdminSession()",
  "agentSaveBudgetSchema.safeParse(input)",
  "findSavableBudgetCall({ conversationId, toolCallId, userId: actorId })",
  "await getAgentBudget({ slug })",
  "reviseAgentProposal({",
  "return await confirmAgentProposal(proposal.id);",
].forEach((text) => assert.ok(save.includes(text), `save-budget.ts: ${text}`));
assert.ok(save.indexOf("findSavableBudgetCall(") < save.indexOf("reviseAgentProposal("));
assert.match(save, /if \(!call\) return \{ error: "Ese presupuesto ya no está en la conversación\." \};/);
assert.doesNotMatch(save, /createBudget\(|db\.budget\./);

const calls = read("data/agent/tool-calls.ts");
["await requireAdminSession();", "conversation: { userId: input.userId }", 'role: "ASSISTANT"', "isSavableBudgetPartType(part.type)", 'part.state === "output-available"', "output?.ok === true"]
  .forEach((text) => assert.ok(calls.includes(text), `tool-calls.ts: ${text}`));

// Revising only touches a proposal that has not run, and audits only then.
const store = read("lib/agent/proposal-store.ts");
assert.match(store, /where: \{ id: existing\.id, status: \{ in: \[\.\.\.REVISABLE_PROPOSAL_STATUSES\] \} \}/);
assert.match(store, /if \(count\) \{\n\s+await auditProposal\(\{[\s\S]*?action: "proposal\.revise"/);
assert.match(store, /existing\.actorId !== input\.actorId \|\| existing\.kind !== input\.kind/);

// --- The editor: the generator form and the budget page detail over one form
// validated with the editor schema (and Spanish messages for the rest of the
// fields); drafts only while it can be saved, compared with the card; a saved
// or executing budget is read-only and shows what was saved, never a draft; a
// name error lands on the field; no saving while the agent answers.
const sheet = read("components/agent/budget-editor/agent-budget-sheet.tsx");
[
  "zodResolver(agentBudgetEditorSchema, { error: agentBudgetEditorErrors })",
  "defaultValues: resolveEditorValues({ values: target.values, draft: target.draft, proposal })",
  "<FormProvider {...form}>",
  "<CreateBudgetForm />",
  "<AgentBudgetDetail />",
  "if (!locked) editor.recordDraft(target.toolCallId, values, target.values);",
  'const saved = proposal?.status === "CONFIRMED" ? proposal.values : null;',
  "form.reset(values);",
  "if (saved) onSaved(saved);",
  'value={locked ? "detail" : editor.tab}',
  'disabled={locked}',
  "form.setError(failure.field, { message: failure.message });",
  "onSuccess: () => editor.dropDraft(target.toolCallId)",
  'if (proposal?.status === "EXECUTING") return { kind: proposal.unknownOutcome ? "unknown" : "executing" };',
].forEach((text) => assert.ok(sheet.includes(text), `agent-budget-sheet.tsx: ${text}`));
assert.match(read("components/agent/budget-editor/agent-budget-footer.tsx"), /disabled=\{busy \|\| waiting\}/);
assert.match(read("components/agent/agent-chat.tsx"), /waiting=\{view\.busy\}/);
const detail = read("components/agent/budget-editor/agent-budget-detail.tsx");
assert.match(detail, /<BudgetDetails option=\{\{ \.\.\.values, has_products: false \}\}/);
assert.match(detail, /hasProducts && <BudgetDetails option=\{\{ \.\.\.values, has_products: true \}\}/);
// The page's cards bring their own max height and scroll: the sheet scrolls.
assert.match(detail, /\[&_\[data-slot=card\]\]:max-h-none \[&_\[data-slot=card\]\]:overflow-visible/);
// Closing gives the focus back to the button that opened the editor.
assert.match(sheet, /onCloseAutoFocus=\{editor\.restoreFocus\}/);
assert.match(read("components/agent/hooks/use-budget-editor.ts"), /opener\.current = document\.activeElement instanceof HTMLElement/);
// With a proposal, the editor starts from its values: what was saved (or
// tried), not what the agent calculated.
const actions = read("components/agent/cards/agent-budget-actions.tsx");
assert.match(actions, /openBudget\(proposal\?\.values \? \{ \.\.\.target, values: proposal\.values \} : target, tab\)/);
// Confirming a proposal with a draft saves the proposal as it is: the card says so.
assert.match(actions, /Confirmar guarda la propuesta sin ellos/);
assert.match(actions, /proposal\?\.status === "EXECUTING" && proposal\.unknownOutcome/);

// --- The model reads the live summary of a revised proposal (and quotes its
// amounts), and what was saved from the editor can be quoted.
const context = read("lib/agent/proposal-context.ts");
assert.match(context, /summary: live\.summary,\n\s+grounding: \{ amounts: getSummaryAmounts\(live\.summary\) \},/);
assert.match(read("lib/agent/turn.ts"), /addGroundedAmounts\(grounding, getConfirmedAmounts\(proposals\)\);/);

// --- Cards: only calculations and create proposals open the editor, with
// their tool call; the proposal card shows the live summary.
assert.match(read("components/agent/agent-tool-part.tsx"), /<AgentToolCard data=\{output\.data\} toolCallId=\{part\.toolCallId\} \/>/);
const totals = read("components/agent/cards/agent-budget-totals-card.tsx");
assert.match(totals, /data\.card === "budget-totals" && <AgentBudgetActions target=\{calculationTarget\(data, toolCallId\)\} showSaved \/>/);
const proposalCard = read("components/agent/cards/agent-proposal-card.tsx");
assert.match(proposalCard, /const status = getDisplayStatus\(live, data\.status\);\n\s+const summary = live\?\.summary \?\? data\.summary;/);
assert.match(proposalCard, /if \(data\.kind !== "CREATE_BUDGET" \|\| !values\) return null;/);

// --- The chat reads the live proposals when there is a savable budget, and
// saving refreshes them (the card turns saved) and the budget lists.
const chat = read("components/agent/agent-chat.tsx");
assert.match(chat, /part\.type\.startsWith\("tool-propose"\) \|\| isSavableBudgetPartType\(part\.type\)/);
assert.match(chat, /<AgentBudgetSheet/);
const mutation = read("components/agent/hooks/use-agent-budget-save.ts");
assert.match(mutation, /onSettled: \(\) => queryClient\.invalidateQueries\(\{ queryKey: agentKeys\.proposals\(conversationId\) \}\)/);
assert.match(mutation, /queryKey: \["budgets"\]/);

// --- Size and harness state.
[
  "lib/agent/budget-draft.ts", "lib/agent/proposals.ts", "lib/agent/proposal-store.ts", "lib/agent/proposal-context.ts",
  "actions/agent/save-budget.ts", "data/agent/tool-calls.ts", "components/agent/hooks/use-budget-editor.ts",
  "components/agent/budget-editor/agent-budget-sheet.tsx", "components/agent/budget-editor/agent-budget-footer.tsx",
]
  .forEach((path) => assert.ok(read(path).trimEnd().split("\n").length <= 200, `${path} supera las 200 líneas`));
const features = JSON.parse(read("feature_list.json")).features as { id: number; name: string }[];
assert.equal(features.find((feature) => feature.id === 43)?.name, "agent_budget_editor");
