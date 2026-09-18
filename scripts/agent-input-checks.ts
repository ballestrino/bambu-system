import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Prisma } from "@prisma/client";

import {
  budgetOptionToFormValues,
  runBudgetCalculation,
  withEffectiveIva,
} from "../lib/agent/budget-calculation";
import { selectQuotedSources, type OfficialSource } from "../lib/agent/grounding";
import { toolOk, toPlainResult } from "../lib/agent/tool-result";
import { calculateBudgetInputSchema } from "../schemas/agent-tools";
import { defaultBudgetValues } from "../schemas/BudgetSchema";

// Entradas y salidas de las tools que encontró la revisión de la 39: IVA 0,
// fuentes de un borrador, JSON plano. Lo usa check:agent-tools.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

// --- IVA 0: calculateBudgetTotals reads it as 22 (`|| 22`), so accepting it
// labels amounts with IVA as "sin IVA". The tool input refuses it...
const noChanges = Object.fromEntries(
  Object.keys(calculateBudgetInputSchema.shape.changes.shape).map((key) => [key, null])
);
const input = (iva: number | null) => ({ budgetSlug: null, fromDefaults: null, changes: { ...noChanges, iva } });
assert.equal(calculateBudgetInputSchema.safeParse(input(0)).success, false);
assert.equal(calculateBudgetInputSchema.safeParse(input(-5)).success, false);
assert.equal(calculateBudgetInputSchema.safeParse(input(10)).success, true);
// ...and every base (saved budget or unsaved form) starts from the IVA the
// calculation really uses, so inputs, totals and proposals agree.
const zero = withEffectiveIva({ ...defaultBudgetValues, iva: 0 });
assert.equal(zero.iva, 22);
assert.equal(runBudgetCalculation(zero).ivaPercent, zero.iva);
assert.equal(withEffectiveIva({ ...defaultBudgetValues, iva: 10 }).iva, 10);
const stored = budgetOptionToFormValues({
  name: "IVA cero",
  description: null,
  budgetOptions: [{ ...defaultBudgetValues, iva: 0, has_products: true }],
});
assert.equal(stored.iva, 22);
assert.match(read("lib/agent/context.ts"), /const values = withEffectiveIva\(raw\);/);

// --- A draft's sources are the official options it actually quotes.
const source = (sourceOptionId: string, final: number): OfficialSource => ({
  sourceOptionId, officialBudgetId: `off_${sourceOptionId}`, name: sourceOptionId, version: 1, hasProducts: false,
  prices: { net: final / 1.22, ivaAmount: final - final / 1.22, final, hourlyNet: 400 },
});
const quoted = selectQuotedSources([source("a", 9760), source("b", 12200)], [9760, 555]);
assert.deepEqual(quoted.map((item) => item.sourceOptionId), ["a"]);
assert.deepEqual(selectQuotedSources([source("a", 9760)], []), []);

// --- Every tool output is plain JSON at runtime, not only by convention:
// runTool passes each result through toPlainResult.
assert.deepEqual(
  toPlainResult(toolOk({ amount: new Prisma.Decimal("12.50"), at: new Date("2026-09-01T00:00:00.000Z"), skip: undefined })),
  { ok: true, data: { amount: 12.5, at: "2026-09-01T00:00:00.000Z" } }
);
assert.match(read("lib/agent/tool-result.ts"), /return toPlainResult\(await execute\(\)\);/);

// --- Resending a message id only works for the same user text; the model's
// title never overwrites a rename; the monthly top 10 ranks priced usage.
const store = read("lib/agent/conversation-store.ts");
assert.match(store, /existing\.role !== "USER" \|\| existing\.text !== text/);
assert.match(read("lib/agent/conversation-title.ts"), /where: \{ id: input\.conversationId, title: input\.replaceTitle \}/);
assert.match(read("data/agent/usage.ts"), /conversationId: \{ not: null \}, costUsd: \{ not: null \}/);
