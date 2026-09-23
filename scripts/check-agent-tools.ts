import assert from "node:assert/strict";

import { Prisma } from "@prisma/client";

import "./agent-source-checks";
import { TRANSPORTATION_PAY_PER_VISIT } from "../components/ops/compensation-utils";
import {
  applyBudgetChanges,
  budgetOptionToFormValues,
  getStoredOptionAmounts,
  runBudgetCalculation,
  solveTargetPrice,
} from "../lib/agent/budget-calculation";
import { BUSINESS_PROFILE, LITERAL_E_NOTE } from "../lib/agent/business-profile";
import { buildEmailDraftInstructions } from "../lib/agent/email-prompt";
import { AGENT_SKILLS, AGENT_SKILL_IDS, resolveSkillToolNames } from "../lib/agent/skills";
import { PRICE_RULE, buildAgentInstructions } from "../lib/agent/system-prompt";
import { AGENT_TOOL_NAMES, isAgentToolName } from "../lib/agent/tool-catalog";
import { toPlainJson } from "../lib/agent/tool-result";
import {
  calculateBudgetTotals,
  calculateEffectiveVisits,
  calculateEstimates,
  PRODUCT_MARGIN_PCT,
} from "../lib/budget-calculations";
import { URUGUAY_EMPLOYER_BPS_PERCENT } from "../lib/ops/finance/payroll-accruals";
import { agentChatRequestSchema } from "../schemas/agent";
import { queryOperationsInputSchema } from "../schemas/agent-tools";
import { defaultBudgetValues, type BudgetFormValues } from "../schemas/BudgetSchema";
import "./agent-grounding-checks";
import "./agent-input-checks";

const round = (value: number) => Math.round(value * 100) / 100;

// --- Round trip: a budget saved the way createBudget saves it reads back as
// the same form values, choosing the option with products.
const storeOption = (values: BudgetFormValues, hasProducts: boolean) => ({
  ...values,
  has_products: hasProducts,
  incidence_contribution: values.incidence_enabled ? values.incidence_contribution : 0,
  company_contribution: values.company_enabled ? values.company_contribution : 0,
  personal_contribution: values.personal_enabled ? values.personal_contribution : 0,
  products_price: hasProducts ? values.products_price : 0,
});
const noPersonal = { ...defaultBudgetValues, personal_enabled: false };
const readBack = budgetOptionToFormValues({
  name: "Limpieza Norte",
  description: null,
  budgetOptions: [storeOption(noPersonal, false), storeOption(noPersonal, true)],
});
(["visits", "visit_type", "hours_per_visit", "nominal_hour", "employees", "revenue_percent",
  "products_price", "transportation_cost", "iva", "incidence_contribution"] as const)
  .forEach((field) => assert.equal(readBack[field], defaultBudgetValues[field], field));
assert.deepEqual([readBack.name, readBack.personal_enabled], ["Limpieza Norte", false]);

// --- The agent calculation is the form calculation, rounded to cents (the
// hourly price, a reference, to pesos since feature 44).
const totals = calculateBudgetTotals(defaultBudgetValues);
const calculation = runBudgetCalculation(defaultBudgetValues);
assert.equal(calculation.withoutProducts.final, round(totals.finalPriceService));
assert.equal(calculation.withProducts?.final, round(totals.totalFinalWithProducts));
assert.equal(calculation.withProducts?.hourlyNet, Math.round(totals.hourlyPriceNoTaxWithProducts));
assert.equal(calculation.serviceCost, round(totals.costBasisNoProducts));
assert.equal(runBudgetCalculation({ ...defaultBudgetValues, products_price: 0 }).withProducts, null);
assert.deepEqual(getStoredOptionAmounts([{ price: 1220, iva: 22 }]), [1000, 220, 1220]);

// --- Changes behave like the form: the final price follows, a contribution
// enabled at 0 % takes its default, and estimates recalculate on request.
const margin = applyBudgetChanges(defaultBudgetValues, { revenue_percent: 40 });
assert.deepEqual(margin.changedFields, ["revenue_percent"]);
// Re-sending base values does not count as a change; overriding one does, so
// a guessed field shows up (the smoke found personal_enabled flipped this way).
const echoed = applyBudgetChanges(defaultBudgetValues, {
  revenue_percent: 40, visits: defaultBudgetValues.visits, personal_enabled: false,
});
assert.deepEqual(echoed.changedFields, ["revenue_percent", "personal_enabled"]);
assert.equal(
  margin.values.price,
  Number(calculateBudgetTotals(margin.values).totalFinalWithProducts.toFixed(2))
);
const enabled = applyBudgetChanges(
  { ...defaultBudgetValues, personal_enabled: false, personal_contribution: 0 },
  { personal_enabled: true }
);
assert.equal(enabled.values.personal_contribution, defaultBudgetValues.personal_contribution);
const estimated = applyBudgetChanges(defaultBudgetValues, { visits: 2, estimateTransport: true });
assert.equal(
  estimated.values.transportation_cost,
  calculateEstimates({ ...defaultBudgetValues, visits: 2 }).transportation_cost
);
assert.deepEqual([...estimated.changedFields].sort(), ["transportation_cost", "visits"]);

// --- Target price: below cost clamps to 0 %, above it lands on the target.
const clamped = solveTargetPrice(defaultBudgetValues, { kind: "hourly", amount: 1 });
assert.equal(clamped?.revenuePercent, 0);
assert.equal(clamped?.wasClamped, true);
const solved = solveTargetPrice(defaultBudgetValues, { kind: "hourly", amount: 600 });
assert.ok(solved && !solved.wasClamped);
assert.ok(Math.abs(runBudgetCalculation(solved.values).withoutProducts.hourlyNet - 600) < 0.01);
assert.equal(solveTargetPrice({ ...defaultBudgetValues, visits: 0 }, { kind: "service", amount: 9 }), null);

// --- One source of business facts, equal to the constants already in use.
const estimateFor4Hours = calculateEstimates({ visits: 1, visit_type: "days", hours_per_visit: 4, employees: 1 });
assert.equal(BUSINESS_PROFILE.transportPerVisit, TRANSPORTATION_PAY_PER_VISIT);
assert.equal(BUSINESS_PROFILE.transportPerVisit, estimateFor4Hours.transportation_cost);
assert.equal(BUSINESS_PROFILE.productsPricePerFourHours, estimateFor4Hours.products_price);
assert.equal(BUSINESS_PROFILE.weeklyMultiplier, calculateEffectiveVisits(1, "week"));
assert.equal(BUSINESS_PROFILE.ivaPercent, 22);
assert.equal(BUSINESS_PROFILE.productMarginPercent, PRODUCT_MARGIN_PCT);
assert.equal(BUSINESS_PROFILE.employerBpsPercent, URUGUAY_EMPLOYER_BPS_PERCENT);
assert.equal(BUSINESS_PROFILE.personalBpsPercent, 18.1);
// The exact phrase of the retired budget chat prompt (data/ai-system-message.ts,
// removed in feature 41): clients already receive it word for word.
assert.equal(LITERAL_E_NOTE, "Nota: Mientras la empresa continúe bajo régimen Literal E, se aplicará el monto sin IVA.");

// --- The prompt carries the price rule, Literal E, the phone, the skill and
// the budget in context.
const instructions = buildAgentInstructions({
  today: "jueves, 18 de setiembre de 2026",
  actorName: "Ana",
  skill: AGENT_SKILLS.emails,
  budgetContextText: "CONTEXTO-DE-PRUEBA",
  approvedKnowledge: ["- Estilo · saludo: cordial"],
});
[LITERAL_E_NOTE, BUSINESS_PROFILE.phone, PRICE_RULE, AGENT_SKILLS.emails.instructions,
  "CONTEXTO-DE-PRUEBA", "- Estilo · saludo: cordial", "jueves, 18 de setiembre de 2026"]
  .forEach((text) => assert.ok(instructions.includes(text), text));
const bare = buildAgentInstructions({
  today: "hoy", actorName: null, skill: AGENT_SKILLS.general, approvedKnowledge: [],
});
assert.ok(bare.includes("No hay un presupuesto en contexto."));
assert.ok(!bare.includes("Conocimiento aprobado"));
[LITERAL_E_NOTE, BUSINESS_PROFILE.phone].forEach((text) => assert.ok(buildEmailDraftInstructions("email").includes(text)));
assert.match(buildEmailDraftInstructions("whatsapp"), /Texto plano/);

// --- Skills only list real tools, General covers them all, and the business
// profile is always available.
assert.deepEqual(Object.keys(AGENT_SKILLS).sort(), [...AGENT_SKILL_IDS].sort());
Object.values(AGENT_SKILLS).forEach((skill) => {
  skill.tools.forEach((name) => assert.ok(isAgentToolName(name), `${skill.id}: ${name}`));
  assert.ok(skill.suggestions.length >= 3, skill.id);
  assert.equal(resolveSkillToolNames(skill)[0], "getBusinessProfile");
});
assert.deepEqual([...AGENT_SKILLS.general.tools].sort(), [...AGENT_TOOL_NAMES].sort());
assert.ok(resolveSkillToolNames(AGENT_SKILLS.emails).includes("draftEmail"));
assert.ok(!resolveSkillToolNames(AGENT_SKILLS.consejos).includes("draftEmail"));
assert.ok(!resolveSkillToolNames(AGENT_SKILLS.presupuestos).includes("queryOperations"));

// --- Inputs: unknown operation kinds and bad months are rejected; the chat
// body only takes a user text message.
const noFilters = { query: null, month: null, jobId: null, employeeId: null, jobStatus: null, visitStatus: null, costKind: null, includeInactive: null };
assert.equal(queryOperationsInputSchema.safeParse({ ...noFilters, kind: "payroll" }).success, false);
assert.equal(queryOperationsInputSchema.safeParse({ ...noFilters, kind: "visits", month: "2026-13" }).success, false);
assert.equal(queryOperationsInputSchema.safeParse({ ...noFilters, kind: "visits", month: "2026-09" }).success, true);
// Every field is required and nullable: omitting one is rejected, so the model always says null.
assert.equal(queryOperationsInputSchema.safeParse({ kind: "visits" }).success, false);
const request = {
  id: "abcdEFGH1234",
  message: { id: "msgABCDEFGH12", role: "user", parts: [{ type: "text", text: "Hola" }] },
  mode: "medio",
};
const parsedRequest = agentChatRequestSchema.parse(request);
assert.equal(parsedRequest.skill, "general");
assert.equal(parsedRequest.trigger, "submit-message");
assert.equal(agentChatRequestSchema.safeParse({ ...request, mode: "maximo" }).success, false);
assert.equal(
  agentChatRequestSchema.safeParse({ ...request, message: { ...request.message, role: "assistant" } }).success,
  false
);
assert.equal(
  agentChatRequestSchema.safeParse({
    ...request,
    message: { ...request.message, parts: [{ type: "file", url: "https://example.com/a.png" }] },
  }).success,
  false
);
assert.equal(
  agentChatRequestSchema.safeParse({ ...request, context: { kind: "form", values: { name: "", visits: "2" } } }).success,
  true
);

// --- Tool outputs are plain JSON: Decimal becomes a number, Date an ISO string.
assert.deepEqual(
  toPlainJson({
    amount: new Prisma.Decimal("12.50"),
    at: new Date("2026-09-01T00:00:00.000Z"),
    nested: [{ value: new Prisma.Decimal("0.1") }],
    skip: undefined,
    fn: () => 1,
    bad: Number.NaN,
  }),
  { amount: 12.5, at: "2026-09-01T00:00:00.000Z", nested: [{ value: 0.1 }], bad: null }
);

console.log("Agent tool checks passed");
