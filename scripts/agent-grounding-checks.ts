import assert from "node:assert/strict";

import { LITERAL_E_NOTE } from "../lib/agent/business-profile";
import { toAgentErrorMessage } from "../lib/agent/errors";
import {
  collectGroundingFromMessages,
  createGrounding,
  validateEmailDraft,
  type OfficialSource,
} from "../lib/agent/grounding";
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getPayrollWorkMonthKey,
  getZonedMonthRange,
  parseMonthKey,
  shiftMonthKey,
  toAssignedMonth,
} from "../lib/agent/month";
import {
  createUsageCollector,
  groupUsageEntries,
  priceUsageEntry,
  summarizeUsage,
} from "../lib/agent/usage-collector";
import { EMPTY_USAGE } from "../lib/ai/usage";

// Evidencia de precios, validación de borradores, consumo y meses. Lo usa
// check:agent-tools.

// --- Grounding survives reloads: it is rebuilt from the persisted tool parts,
// ignoring failed, errored and unfinished calls.
const official: OfficialSource = {
  sourceOptionId: "opt_1",
  officialBudgetId: "off_1",
  name: "Limpieza de oficina",
  version: 3,
  hasProducts: false,
  prices: { net: 8000, ivaAmount: 1760, final: 9760, hourlyNet: 463 },
};
const grounding = collectGroundingFromMessages([
  { parts: [{ type: "text" }] },
  {
    parts: [
      { type: "tool-calculateBudget", state: "output-available", output: { ok: true, data: { grounding: { amounts: [5000, 1100, 6100] } } } },
      { type: "tool-searchOfficialBudgets", state: "output-available", output: { ok: true, data: { grounding: { amounts: [], sources: [official] } } } },
      { type: "tool-getBudget", state: "output-available", output: { ok: false, error: { code: "not_found", message: "x" } } },
      { type: "tool-getBudget", state: "output-error", output: { ok: true, data: { grounding: { amounts: [1] } } } },
      { type: "tool-draftEmail", state: "input-available" },
    ],
  },
]);
assert.deepEqual([...grounding.amounts].sort((a, b) => a - b), [463, 1100, 1760, 5000, 6100, 8000, 9760]);
assert.deepEqual([...grounding.evidence.keys()], ["opt_1"]);

// --- The four draft outcomes.
const draft = (price: string, note = true) =>
  `Precio sin IVA: $ ${price}\n${note ? LITERAL_E_NOTE : ""}\nSaludos cordiales.`;
const failure = (body: string, source = grounding) => {
  const check = validateEmailDraft(body, source);
  return check.ok ? "ok" : check.code;
};
assert.deepEqual(validateEmailDraft("Hola, te escribo sin precios.", createGrounding()), {
  ok: true,
  quotedAmounts: [],
});
assert.equal(failure(draft("5.000,00"), createGrounding()), "ungrounded_price");
assert.equal(failure(draft("5.100,00")), "price_mismatch");
assert.equal(failure(draft("5.000,00", false)), "missing_literal_e");
assert.deepEqual(validateEmailDraft(draft("5.000,00"), grounding), { ok: true, quotedAmounts: [5000] });
// WhatsApp may bold the note; it still counts.
assert.equal(failure(`Te paso el precio: $ 9.760\n*${LITERAL_E_NOTE}*`), "ok");

// --- Usage: a turn's steps add up in one row per kind and model, nested calls
// (draftEmail) count as SKILL, and the gateway cost wins over the estimate.
const step = { ...EMPTY_USAGE, inputTokens: 10_000, cachedInputTokens: 2_000, outputTokens: 1_000 };
const collector = createUsageCollector();
collector.add({ kind: "TURN", modelId: "gpt-5.6-terra", reasoning: "high", usage: step, gatewayCostUsd: null });
collector.add({ kind: "TURN", modelId: "gpt-5.6-terra", reasoning: "high", usage: step, gatewayCostUsd: null });
collector.add({
  kind: "SKILL",
  modelId: "gpt-5.6-terra",
  reasoning: "high",
  usage: { ...EMPTY_USAGE, inputTokens: 1_000_000 },
  gatewayCostUsd: null,
});
const groups = groupUsageEntries(collector.entries(), {});
assert.equal(groups.length, 2);
const turnGroup = groups.find((group) => group.kind === "TURN");
assert.equal(turnGroup?.usage.inputTokens, 20_000);
assert.equal(turnGroup?.costUsd, 0.0568);
assert.equal(turnGroup?.reasoning, "high");
// Another reasoning on the same model and kind is its own row.
const lighter = { kind: "TURN" as const, modelId: "gpt-5.6-terra", reasoning: "medium" as const, usage: step, gatewayCostUsd: null };
assert.equal(groupUsageEntries([...collector.entries(), lighter], {}).length, 3);
const summary = summarizeUsage(collector.entries(), {});
assert.equal(summary.modelId, "gpt-5.6-terra");
assert.equal(summary.costUsd, 2.0568);
assert.equal(summary.priced, true);
assert.equal(summary.tokens.total, 1_020_000 + 2_000);

const vendor = { kind: "TURN" as const, modelId: "anthropic/claude-sonnet-5", reasoning: "medium" as const, usage: step };
const mixed = summarizeUsage(
  [{ ...vendor, gatewayCostUsd: null }, { ...vendor, gatewayCostUsd: 0.5 }],
  {}
);
assert.equal(mixed.priced, false);
assert.equal(mixed.costUsd, 0.5);
assert.equal(summarizeUsage([], {}).priced, false);

// A malformed price override leaves the usage unpriced instead of failing the
// turn. The error goes to the server log; silenced here.
const logError = console.error;
console.error = () => {};
assert.deepEqual(
  priceUsageEntry(
    { kind: "TURN", modelId: "gpt-5.6-terra", reasoning: "high", usage: step, gatewayCostUsd: null },
    { AI_PRICE_GPT_5_6_TERRA: "caro" }
  ),
  { costUsd: null, priced: false }
);
console.error = logError;

// --- Months in Montevideo, whatever the server's time zone.
assert.equal(getCurrentMonthKey(new Date("2026-09-01T02:00:00Z")), "2026-08");
assert.equal(getCurrentMonthKey(new Date("2026-09-01T03:00:00Z")), "2026-09");
assert.equal(getZonedMonthRange("2026-09").start.toISOString(), "2026-09-01T03:00:00.000Z");
assert.equal(getZonedMonthRange("2026-09").end.toISOString(), "2026-10-01T02:59:59.999Z");
assert.equal(toAssignedMonth("2026-09").toISOString(), "2026-09-01T00:00:00.000Z");
assert.equal(shiftMonthKey("2026-12", 1), "2027-01");
assert.equal(getPayrollWorkMonthKey("2026-09"), "2026-08");
assert.equal(getPayrollWorkMonthKey("2026-01"), "2025-12");
assert.equal(formatMonthLabel("2026-09"), "setiembre de 2026");
assert.throws(() => parseMonthKey("2026-9"), /Mes inválido/);

// --- Config errors reach the user as they are; anything else stays generic.
assert.equal(toAgentErrorMessage(new Error("Falta configurar OPENAI_API_KEY")), "Falta configurar OPENAI_API_KEY");
assert.match(toAgentErrorMessage(new Error('AI_REASONING_MEDIO inválido: "max"')), /^AI_REASONING_MEDIO/);
assert.equal(
  toAgentErrorMessage(new Error("connect ECONNREFUSED 10.0.0.1:5432")),
  "El asistente no pudo responder. Probá de nuevo en un momento."
);
