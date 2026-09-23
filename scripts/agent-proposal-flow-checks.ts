import assert from "node:assert/strict";

import { getCalculationAmounts } from "../lib/agent/budget-calculation";
import { collectGroundingFromMessages } from "../lib/agent/grounding";
import {
  buildCreateBudgetProposal,
  buildUpdateBudgetProposal,
  type BuiltProposal,
} from "../lib/agent/proposal-builders";
import {
  AGENT_PROPOSAL_STATUSES,
  checkProposalPreconditions,
  describeConfirmOutcome,
  describeRejectOutcome,
  getProposalExpiry,
  isProposalExpired,
  PROPOSAL_STALE_MESSAGE,
  PROPOSAL_TTL_MS,
  resolveProposalStatus,
  serializeProposal,
  type AgentProposalStatus,
  type ProposalRow,
} from "../lib/agent/proposals";
import {
  formatProposalsForPrompt,
  getConfirmedAmounts,
  withLiveProposals,
  type ProposalPromptItem,
} from "../lib/agent/proposal-context";
import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { buildAgentInstructions, PROPOSALS_HEADING } from "../lib/agent/system-prompt";
import { AGENT_TOOL_CATALOG, AGENT_TOOL_NAMES } from "../lib/agent/tool-catalog";
import {
  buildDuplicateBudgetProposal,
  buildPublishOfficialBudgetProposal,
} from "../lib/agent/stored-budget-proposals";
import { parseProposalPayload } from "../schemas/agent-proposals";
import { defaultBudgetValues } from "../schemas/BudgetSchema";
import { budget, roundTrip } from "./agent-proposal-fixture";

// Precondiciones, vencimiento, estados, prompt y habilidades de las
// propuestas. Lo usa check:agent-proposals.
const parse = (built: BuiltProposal) => {
  assert.ok(built.ok);
  const parsed = parseProposalPayload(built.kind, roundTrip(built.payload));
  assert.ok(parsed);
  return parsed;
};

// --- Preconditions are re-checked at confirm time against a fresh read: the
// budget must still be the one the card showed.
const state = { userId: "user_1", updatedAt: budget.updatedAt, officialBudget: null };
const later = new Date(budget.updatedAt.getTime() + 1000);
const update = parse(buildUpdateBudgetProposal({ budget, name: null, description: null, changes: { revenue_percent: 40 } }));
assert.equal(checkProposalPreconditions(update, state, "user_1"), null);
assert.equal(checkProposalPreconditions(update, { ...state, updatedAt: later }, "user_1"), PROPOSAL_STALE_MESSAGE);
// Published as official in between: saving would publish a version the card never announced.
assert.equal(checkProposalPreconditions(update, { ...state, officialBudget: { id: "off_9" } }, "user_1"), PROPOSAL_STALE_MESSAGE);
assert.equal(checkProposalPreconditions(update, null, "user_1"), "El presupuesto ya no existe.");
const duplicate = parse(buildDuplicateBudgetProposal({ budget, actorId: "user_1" }));
assert.match(checkProposalPreconditions(duplicate, state, "user_2") ?? "", /Solo quien creó/);
assert.equal(checkProposalPreconditions(duplicate, { ...state, updatedAt: later }, "user_1"), PROPOSAL_STALE_MESSAGE);
const publish = parse(buildPublishOfficialBudgetProposal({ budget }));
assert.equal(checkProposalPreconditions(publish, state, "user_1"), null);
assert.match(checkProposalPreconditions(publish, { ...state, officialBudget: { id: "off_1" } }, "user_1") ?? "", /ya está publicado/);
const create = parse(buildCreateBudgetProposal({
  base: { source: "defaults", values: defaultBudgetValues }, name: "Oficina Sur", description: null, changes: {},
}));
assert.equal(checkProposalPreconditions(create, null, "user_1"), null);

// --- Expiry: 24 hours, exactly the boundary the claim uses (expiresAt > now).
const createdAt = new Date("2026-09-18T15:00:00.000Z");
const expiresAt = getProposalExpiry(createdAt);
assert.equal(PROPOSAL_TTL_MS, 24 * 60 * 60 * 1000);
assert.equal(expiresAt.getTime() - createdAt.getTime(), PROPOSAL_TTL_MS);
const pending = { status: "PENDING" as const, expiresAt };
assert.equal(isProposalExpired(pending, new Date(expiresAt.getTime() - 1)), false);
assert.equal(isProposalExpired(pending, expiresAt), true);
assert.equal(resolveProposalStatus(pending, expiresAt), "EXPIRED");
// Only a PENDING proposal expires: a resolved one keeps its status.
assert.equal(resolveProposalStatus({ status: "CONFIRMED", expiresAt }, new Date(expiresAt.getTime() + 1)), "CONFIRMED");

// --- Reads show the live status without writing: an overdue PENDING row reads EXPIRED.
const row: ProposalRow = {
  id: "prop_1", kind: "UPDATE_BUDGET", status: "PENDING", summary: { title: "Guardar cambios en “Limpieza Norte”" },
  result: null, error: null, toolCallId: "call_1", conversationId: "conv_1", expiresAt, resolvedAt: null, createdAt,
  updatedAt: createdAt,
};
const overdue = serializeProposal(row, new Date(expiresAt.getTime() + 1));
assert.deepEqual([overdue.status, overdue.expiresAt, overdue.resolvedAt], ["EXPIRED", expiresAt.toISOString(), null]);

// --- Confirm and reject answer from the stored status, so repeating them is safe.
const withStatus = (status: AgentProposalStatus, error: string | null = null) => ({
  ...serializeProposal(row, createdAt), status, error,
});
assert.equal(describeConfirmOutcome(withStatus("CONFIRMED")).success, "Propuesta confirmada");
assert.equal(describeConfirmOutcome(withStatus("FAILED", PROPOSAL_STALE_MESSAGE)).error, PROPOSAL_STALE_MESSAGE);
AGENT_PROPOSAL_STATUSES.filter((status) => status !== "CONFIRMED").forEach((status) =>
  assert.ok(describeConfirmOutcome(withStatus(status)).error, status)
);
assert.equal(describeRejectOutcome(withStatus("REJECTED")).success, "Propuesta rechazada");
assert.match(describeRejectOutcome(withStatus("CONFIRMED")).error ?? "", /no se puede rechazar/);

// --- The prompt lists each proposal with its live status and what it changes:
// the real smoke had four "Guardar cambios" lines the model could not tell
// apart. The policy says saving is always a proposal instead of "you can't save".
const summary = (title: string, changes: ProposalPromptItem["summary"]["changes"] = []) =>
  ({ title, changes }) as ProposalPromptItem["summary"];
const margin = { field: "revenue_percent", label: "Margen del servicio" };
const confirmedResult = { label: "Limpieza Norte", url: "/dashboard/budgets/budget/limpieza-norte", budgetId: "budget_1", slug: "limpieza-norte", officialBudgetId: null, officialVersion: null };
const items: ProposalPromptItem[] = [
  { status: "CONFIRMED", summary: summary("Guardar cambios en “Limpieza Norte”", [{ ...margin, before: 45, after: 40 }]), error: null, result: confirmedResult },
  { status: "FAILED", summary: summary("Guardar cambios en “Limpieza Norte”", [{ ...margin, before: 45, after: 35.5 }]), result: null, error: PROPOSAL_STALE_MESSAGE },
  { status: "PENDING", summary: summary("Duplicar “Limpieza Norte”"), result: null, error: null },
];
assert.deepEqual(formatProposalsForPrompt(items).split("\n"), [
  "- Guardar cambios en “Limpieza Norte” (Margen del servicio 45 → 40): confirmada. Quedó en /dashboard/budgets/budget/limpieza-norte.",
  `- Guardar cambios en “Limpieza Norte” (Margen del servicio 45 → 35,5): falló (${PROPOSAL_STALE_MESSAGE}).`,
  "- Duplicar “Limpieza Norte”: pendiente de confirmar.",
]);

// --- The history sent to the model carries the live status and summary in
// each propose* output (the saved output says PENDING forever, and a proposal
// saved from the editor of feature 43 has the summary of what was edited);
// the rest is untouched and grounding comes from the live summary.
const proposalPart = (proposalId: string, amounts: number[]) => ({
  type: "tool-proposeCreateBudget", state: "output-available",
  output: { ok: true, data: { card: "proposal", proposalId, status: "PENDING", summary: {}, grounding: { amounts } } },
});
const edited = buildCreateBudgetProposal({ base: { source: "edited", values: { ...defaultBudgetValues, employees: 2 } }, name: "Oficina Norte", description: null, changes: {} });
assert.ok(edited.ok && edited.summary.after);
const history = [{ id: "m1", parts: [{ type: "text", text: "hola" }, proposalPart("prop_1", [18979.9]), proposalPart("prop_unknown", [111.11])] }];
const live = withLiveProposals(history, [{ id: "prop_1", status: "CONFIRMED", result: confirmedResult, error: null, summary: edited.summary }]);
const [, patched, unknown] = live[0].parts as ReturnType<typeof proposalPart>[];
assert.deepEqual(
  [patched.output.data.status, (patched.output.data as { result?: { url: string } }).result?.url, patched.output.data.summary],
  ["CONFIRMED", confirmedResult.url, edited.summary]
);
assert.equal(unknown.output.data.status, "PENDING");
// The stored history is not mutated: only the copy sent to the model changes.
assert.equal((history[0].parts[1] as ReturnType<typeof proposalPart>).output.data.status, "PENDING");
const liveAmounts = collectGroundingFromMessages(live).amounts;
assert.ok(liveAmounts.has(edited.summary.after.withoutProducts.final) && liveAmounts.has(111.11));
assert.ok(!liveAmounts.has(18979.9), "the saved output's amounts are replaced by the live ones");
// The block says what was saved, and those finals can be quoted even when no
// propose* output shows them (a calculation saved from the editor).
const savedLine = formatProposalsForPrompt([{ status: "CONFIRMED", summary: edited.summary, result: confirmedResult, error: null }]);
const finalOf = (amount: number) => amount.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
assert.ok(savedLine.endsWith(`Quedó en ${confirmedResult.url}, con $ ${finalOf(edited.summary.after.withoutProducts.final)} sin productos y $ ${finalOf(edited.summary.after.withProducts?.final ?? 0)} con productos (finales con IVA).`), savedLine);
const confirmedItem = { status: "CONFIRMED" as const, summary: edited.summary };
assert.deepEqual(getConfirmedAmounts([confirmedItem, { ...confirmedItem, status: "PENDING" }]), getCalculationAmounts(edited.summary.after));
const prompt = (proposals: ProposalPromptItem[]) =>
  buildAgentInstructions({ today: "hoy", actorName: null, skill: AGENT_SKILLS.presupuestos, approvedKnowledge: [], proposals });
assert.ok(prompt(items).includes(`${PROPOSALS_HEADING} (`));
assert.ok(prompt(items).includes(formatProposalsForPrompt(items)));
const bare = prompt([]);
assert.ok(!bare.includes(`${PROPOSALS_HEADING} (`));
assert.match(bare, /Guardar siempre es una propuesta/);
assert.doesNotMatch(bare, /no podés crear, modificar ni borrar/);
assert.doesNotMatch(AGENT_SKILLS.presupuestos.instructions, /Todavía no podés guardar/);

// --- The four tools are proposals: Presupuestos and General have them,
// Consejos doesn't, and Emails only creates (the budget it calculated to
// answer a quote request, feature 44).
const PROPOSE_TOOLS = ["proposeCreateBudget", "proposeUpdateBudget", "proposeDuplicateBudget", "proposePublishOfficialBudget"] as const;
assert.deepEqual(
  AGENT_TOOL_NAMES.filter((name) => AGENT_TOOL_CATALOG[name].kind === "proposal").sort(),
  [...PROPOSE_TOOLS].sort()
);
PROPOSE_TOOLS.forEach((name) => {
  assert.ok(resolveSkillToolNames(AGENT_SKILLS.presupuestos).includes(name), name);
  assert.ok(resolveSkillToolNames(AGENT_SKILLS.general).includes(name), name);
  assert.equal(resolveSkillToolNames(AGENT_SKILLS.emails).includes(name), name === "proposeCreateBudget", name);
  assert.ok(!resolveSkillToolNames(AGENT_SKILLS.consejos).includes(name), name);
});
