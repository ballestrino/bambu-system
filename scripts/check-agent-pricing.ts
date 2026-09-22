import assert from "node:assert/strict";

import "./agent-pricing-source-checks";
import { applyAgentChanges, applyNicePrice, describeRounding } from "../lib/agent/agent-pricing";
import {
  applyBudgetChanges,
  budgetOptionToFormValues,
  getCalculationAmounts,
  runBudgetCalculation,
} from "../lib/agent/budget-calculation";
import { BUSINESS_PROFILE, formatBusinessProfile, LITERAL_E_NOTE } from "../lib/agent/business-profile";
import { addGroundedAmounts, createGrounding, validateEmailDraft } from "../lib/agent/grounding";
import { roundProductsPrice, roundUpToPriceStep } from "../lib/agent/price-rounding";
import { buildCreateBudgetProposal, buildUpdateBudgetProposal } from "../lib/agent/proposal-builders";
import { sameServiceWarning } from "../lib/agent/proposal-summary";
import { AGENT_SKILLS, resolveSkillToolNames } from "../lib/agent/skills";
import { buildAgentInstructions, NEW_BUDGET_RULE } from "../lib/agent/system-prompt";
import { calculateEstimates } from "../lib/budget-calculations";
import { findMatchingBudgetsInputSchema } from "../schemas/agent-tools";
import { defaultBudgetValues } from "../schemas/BudgetSchema";
import { budget, fixtureBase, noChanges } from "./agent-proposal-fixture";

// Reglas de precio del agente (feature 44), sin base ni modelo.

// --- The monthly price goes up to the next $ 100 (never down, never on
// float noise); products go to the nearest $ 500, never below $ 500.
assert.deepEqual([BUSINESS_PROFILE.priceStep, BUSINESS_PROFILE.productsStep], [100, 500]);
assert.deepEqual(
  [23456.12, 23400.01, 23400, 23400.004, 99.99, 0].map(roundUpToPriceStep),
  [23500, 23500, 23400, 23400, 100, 0]
);
assert.deepEqual(
  [1512, 1749.99, 1750, 1800, 756, 300, 1, 0].map(roundProductsPrice),
  [1500, 1500, 2000, 2000, 1000, 500, 500, 0]
);
assert.match(formatBusinessProfile(), /múltiplo de \$ 500 más cercano \(mínimo \$ 500\)/);
assert.match(formatBusinessProfile(), /sube al próximo múltiplo de \$ 100 \(hasta \$ 99 más\)/);

// --- A new budget estimates transport and products for its own hours
// (products in multiples of $ 500) and rounds the price without IVA up.
const defaults = { source: "defaults" as const, values: defaultBudgetValues };
const office = { ...noChanges, visits: 2, visit_type: "week" as const, hours_per_visit: 4 };
const fresh = applyAgentChanges(defaults, office);
const estimates = calculateEstimates({ ...defaultBudgetValues, visits: 2 });
assert.equal(fresh.values.transportation_cost, estimates.transportation_cost);
assert.equal(fresh.values.products_price, roundProductsPrice(estimates.products_price));
assert.deepEqual([...fresh.changedFields].sort(), ["products_price", "transportation_cost", "visits"]);
const raw = applyBudgetChanges(defaultBudgetValues, { ...office, estimateTransport: true, estimateProducts: true });
const freshCalc = runBudgetCalculation(fresh.values);
assert.ok(fresh.rounding, "a new budget rounds its price");
assert.equal(fresh.rounding.from, runBudgetCalculation(raw.values).withoutProducts.net);
assert.equal(fresh.rounding.to, freshCalc.withoutProducts.net);
assert.equal(freshCalc.withoutProducts.net % 100, 0);
assert.ok(fresh.rounding.to > fresh.rounding.from && fresh.rounding.to - fresh.rounding.from < 100);
assert.equal(fresh.rounding.revenuePercentFrom, defaultBudgetValues.revenue_percent);
assert.equal(fresh.rounding.revenuePercentTo, fresh.values.revenue_percent);
assert.ok(fresh.values.revenue_percent > defaultBudgetValues.revenue_percent);
// Service in hundreds plus products in multiples of $ 500 (no products margin by default).
assert.ok(freshCalc.withProducts);
assert.equal(freshCalc.withProducts.net % 100, 0);
// The hourly price is a reference in whole pesos; the form price follows the new margin.
assert.ok(Number.isInteger(freshCalc.withoutProducts.hourlyNet) && Number.isInteger(freshCalc.withProducts.hourlyNet));
assert.equal(fresh.values.price, freshCalc.withProducts.final);
// Already a multiple of $ 100: nothing moves.
assert.deepEqual(applyNicePrice(fresh.values), { values: fresh.values, rounding: null });
// Without hours there is no margin to solve: the price stays.
assert.equal(applyNicePrice({ ...defaultBudgetValues, visits: 0 }).rounding, null);

// --- Amounts the user gives are kept; so is asking not to estimate.
const given = applyAgentChanges(defaults, { ...office, products_price: 1800, transportation_cost: 300 });
assert.deepEqual([given.values.products_price, given.values.transportation_cost], [1800, 300]);
assert.equal(applyAgentChanges(defaults, { ...office, estimateProducts: false }).values.products_price, defaultBudgetValues.products_price);
assert.equal(applyAgentChanges(defaults, { ...office, products_price: 0 }).values.products_price, 0);

// --- A margin the user asks for is kept, unless roundPrice is true; roundPrice
// false keeps the exact price.
const margin = applyAgentChanges(defaults, { ...office, revenue_percent: 40 });
assert.deepEqual([margin.rounding, margin.values.revenue_percent], [null, 40]);
const forced = applyAgentChanges(defaults, { ...office, revenue_percent: 40, roundPrice: true });
assert.ok(forced.rounding && forced.rounding.revenuePercentFrom === 40);
assert.equal(runBudgetCalculation(forced.values).withoutProducts.net % 100, 0);
assert.equal(applyAgentChanges(defaults, { ...office, roundPrice: false }).rounding, null);
// roundPrice is not a form field.
assert.ok(!("roundPrice" in applyBudgetChanges(defaultBudgetValues, { roundPrice: true }).values));

// --- A saved budget or the open form: opening it rounds nothing, an IVA
// change does not move the price without IVA, a real change rounds.
const saved = { source: "budget" as const, values: fixtureBase };
assert.equal(runBudgetCalculation(fixtureBase).withoutProducts.net % 100 === 0, false, "the fixture price is not round");
assert.equal(applyAgentChanges(saved, noChanges).rounding, null);
assert.equal(applyAgentChanges(saved, { ...noChanges, iva: 10 }).rounding, null);
assert.equal(applyAgentChanges({ source: "form", values: fixtureBase }, noChanges).rounding, null);
const moreHours = applyAgentChanges(saved, { ...noChanges, hours_per_visit: 5 });
assert.ok(moreHours.rounding);
assert.deepEqual(moreHours.changedFields, ["hours_per_visit"]);
// A saved budget is not new: its transport and products are not re-estimated.
assert.equal(moreHours.values.products_price, fixtureBase.products_price);

// --- Proposals apply the same rules as calculateBudget and say so on the card.
const create = buildCreateBudgetProposal({ base: defaults, name: "Oficina Sur", description: null, changes: office });
assert.ok(create.ok);
assert.deepEqual(create.summary.after, freshCalc);
assert.deepEqual(create.summary.warnings, [describeRounding(fresh.rounding)]);
assert.match(create.summary.warnings[0], /^El precio sin IVA sube de .+ a .+ \(próximo múltiplo de \$ 100\): el margen del servicio pasa de 45 % a /);
const update = buildUpdateBudgetProposal({ budget, name: null, description: null, changes: { ...noChanges, hours_per_visit: 5 } });
assert.ok(update.ok);
const expected = applyAgentChanges({ source: "budget", values: budgetOptionToFormValues(budget) }, { ...noChanges, hours_per_visit: 5 });
assert.deepEqual(runBudgetCalculation(update.payload.values), runBudgetCalculation(expected.values));
assert.deepEqual(update.summary.changes.map((change) => change.field), ["hours_per_visit", "revenue_percent"]);
assert.ok(update.summary.warnings.includes(describeRounding(expected.rounding) ?? ""));
// What the editor of feature 43 saves is kept as typed: no estimates, no rounding.
const typed = { ...fixtureBase, name: "Editado", products_price: 1234 };
const edited = buildCreateBudgetProposal({ base: { source: "edited", values: typed }, name: "Editado", description: null, changes: {} });
assert.ok(edited.ok);
assert.deepEqual([edited.payload.values.products_price, edited.payload.values.revenue_percent], [1234, typed.revenue_percent]);
assert.deepEqual([edited.summary.changes, edited.summary.warnings], [[], []]);
assert.equal(describeRounding(null), null);

// --- The unrounded price cannot be quoted to a client; the rounded one can.
const grounding = createGrounding();
addGroundedAmounts(grounding, getCalculationAmounts(freshCalc));
const money = new Intl.NumberFormat("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quote = (amount: number) => `El servicio sale $ ${money.format(amount)} por mes.\n${LITERAL_E_NOTE}`;
assert.equal(validateEmailDraft(quote(fresh.rounding.from), grounding).ok, false);
assert.equal(validateEmailDraft(quote(fresh.rounding.to), grounding).ok, true);
assert.equal(validateEmailDraft(quote(freshCalc.withoutProducts.hourlyNet), grounding).ok, true);

// --- A new one that already exists: the create card warns.
assert.equal(sameServiceWarning([]), null);
assert.match(sameServiceWarning(["Oficina Centro"]) ?? "", /mismo servicio: “Oficina Centro”\. Revisá que no sea un duplicado\./);
assert.match(sameServiceWarning(["A", "B", "C", "D", "E"]) ?? "", /“A”, “B”, “C” y 2 más\./);

// --- Same service as searchOfficialBudgets: every field is required, the
// service ones are not nullable.
const service = { frequency: "week", visits: 2, hoursPerVisit: 4, employees: null, hasProducts: null };
assert.ok(findMatchingBudgetsInputSchema.safeParse(service).success);
assert.equal(findMatchingBudgetsInputSchema.safeParse({ ...service, visits: null }).success, false);
assert.equal(findMatchingBudgetsInputSchema.safeParse({ frequency: "week", visits: 2, hoursPerVisit: 4 }).success, false);

// --- The prompt: the new-budget steps go with the skills that calculate;
// Emails can look for an equal one and propose saving what it calculated.
const prompt = (skill: keyof typeof AGENT_SKILLS) =>
  buildAgentInstructions({ today: "hoy", actorName: null, skill: AGENT_SKILLS[skill], approvedKnowledge: [] });
(["general", "presupuestos", "emails"] as const).forEach((skill) => assert.ok(prompt(skill).includes(NEW_BUDGET_RULE), skill));
assert.ok(!prompt("consejos").includes(NEW_BUDGET_RULE));
assert.match(NEW_BUDGET_RULE, /searchOfficialBudgets \(un precio oficial vigente gana\) y findMatchingBudgets/);
assert.match(prompt("general"), /o cuando respondés un pedido de presupuesto con uno que tuviste que calcular/);
(["findMatchingBudgets", "proposeCreateBudget", "calculateBudget", "draftEmail"] as const)
  .forEach((name) => assert.ok(resolveSkillToolNames(AGENT_SKILLS.emails).includes(name), name));
assert.ok(resolveSkillToolNames(AGENT_SKILLS.presupuestos).includes("findMatchingBudgets"));
assert.match(AGENT_SKILLS.emails.instructions, /proponé guardarlo con proposeCreateBudget/);
assert.match(AGENT_SKILLS.presupuestos.instructions, /roundPrice true/);

console.log("Agent pricing checks passed");
