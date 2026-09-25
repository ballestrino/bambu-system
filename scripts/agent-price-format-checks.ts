import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatBusinessProfile, LITERAL_E_NOTE } from "../lib/agent/business-profile";
import { buildEmailDraftInstructions, buildEmailDraftPrompt } from "../lib/agent/email-prompt";
import { addGroundedAmounts, createGrounding, validateEmailDraft } from "../lib/agent/grounding";
import { AGENT_SKILLS } from "../lib/agent/skills";
import { buildAgentInstructions, NEW_BUDGET_RULE, PRICE_FORMAT_RULE } from "../lib/agent/system-prompt";
import { classifyOfficialBudgetSearch } from "../lib/official-budgets/search-classification";
import { searchOfficialBudgetsInputSchema } from "../schemas/agent-tools";

// Imported by check-agent-pricing.ts. Price format: prices as "$ X + IVA" and
// one employee when nobody says how many.

// --- Price format: the amount without IVA plus "+ IVA", in the chat and in
// draftEmail, never the "Precio sin IVA" / "Precio con IVA" pair.
assert.match(PRICE_FORMAT_RULE, /\$ 54\.100 \+ IVA/);
Object.values(AGENT_SKILLS).forEach((skill) =>
  assert.ok(
    buildAgentInstructions({ today: "hoy", actorName: null, skill, approvedKnowledge: [] }).includes(PRICE_FORMAT_RULE),
    skill.id
  )
);
assert.doesNotMatch(AGENT_SKILLS.presupuestos.instructions, /precio por hora sin IVA/);
(["email", "whatsapp"] as const).forEach((channel) => {
  const instructions = buildEmailDraftInstructions(channel);
  assert.ok(instructions.includes(PRICE_FORMAT_RULE), channel);
  assert.match(instructions, /'Opción 1 \(sin productos\): \$ X \+ IVA'/);
  assert.match(instructions, /'Precio: \$ X \+ IVA'/);
  assert.doesNotMatch(instructions, /Precio (sin|con) IVA: \$/, channel);
  assert.ok(instructions.includes(LITERAL_E_NOTE), channel);
});
// Whole amounts reach the model without ",00", so it writes $ 54.100 + IVA.
assert.match(
  buildEmailDraftPrompt({ brief: "b", allowedAmounts: [54_100, 1_234.5], sources: [] }),
  /Importes permitidos: \$ 54\.100, \$ 1\.234,50$/m
);
// "+ IVA" after an amount does not break the grounding of the draft.
const grounding = createGrounding();
addGroundedAmounts(grounding, [54_100, 66_002]);
const draft = (body: string) => validateEmailDraft(`${body}\n${LITERAL_E_NOTE}`, grounding);
assert.deepEqual(draft("Opción 1 (sin productos): $ 54.100 + IVA"), { ok: true, quotedAmounts: [54_100] });
assert.equal(draft("Opción 1 (sin productos): $ 54.200 + IVA").ok, false);

// --- One employee unless told otherwise: the prompt says so, and the agent's
// official search sends 1 instead of null (which would be incomplete).
assert.match(NEW_BUDGET_RULE, /Si no dicen cuántas empleadas, es 1: no lo preguntes/);
assert.match(formatBusinessProfile(), /Presupuesto nuevo por defecto: 1 empleada \(si no dicen cuántas\)/);
const officialInput = { service: null, frequency: "week", visits: 2, hoursPerVisit: 4, employees: null, hasProducts: null };
assert.equal(searchOfficialBudgetsInputSchema.parse(officialInput).employees, null);
assert.match(
  readFileSync(join(process.cwd(), "lib/agent/tools/official-budgets.ts"), "utf8"),
  /searchOfficialBudgets\(\{ \.\.\.input, employees: input\.employees \?\? 1 \}\)/
);
// The shared search (the mail agent's) still treats null as missing.
assert.deepEqual(
  classifyOfficialBudgetSearch({ ...officialInput, service: "Oficina", frequency: "week" }, []).missingFields,
  ["employees"]
);
