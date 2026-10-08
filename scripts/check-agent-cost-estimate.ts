import assert from "node:assert/strict";

import {
  estimateMessageCost,
  MIN_SAMPLES_FOR_AVERAGE,
  type MessageUsageSample,
} from "../lib/agent/message-cost-estimate";
import { estimateUsageCost } from "../lib/ai/pricing";

// Costo estimado por mensaje que muestra el selector de modo. Sin base.

const sample = (overrides: Partial<MessageUsageSample>): MessageUsageSample => ({
  modelId: "gpt-6-luna",
  reasoning: "xhigh",
  costUsd: 0.004,
  inputTokens: 40_000,
  cachedInputTokens: 32_000,
  cacheWriteTokens: 8_000,
  outputTokens: 3_500,
  reasoningTokens: 2_900,
  ...overrides,
});

const luna = { modelId: "gpt-6-luna", reasoning: "xhigh" } as const;
const solLow = { modelId: "gpt-6.1-sol", reasoning: "low" } as const;
const solMedium = { modelId: "gpt-6.1-sol", reasoning: "medium" } as const;

// --- With enough messages of the same model and reasoning, the estimate is
// their real average cost.
const lunaSamples = [0.002, 0.004, 0.006, 0.004, 0.004].map((costUsd) => sample({ costUsd }));
assert.equal(lunaSamples.length, MIN_SAMPLES_FOR_AVERAGE);
assert.equal(estimateMessageCost(luna, lunaSamples), 0.004);

// --- Unpriced messages do not count toward the average.
assert.equal(estimateMessageCost(luna, [...lunaSamples, sample({ costUsd: null })]), 0.004);

// --- Too few messages of the spec: the typical usage is priced at the mode's
// model, with the visible output plus the reasoning of its level.
const typical = {
  inputTokens: 40_000,
  cachedInputTokens: 32_000,
  cacheWriteTokens: 8_000,
  outputTokens: 600 + 250,
  reasoningTokens: 250,
};
assert.equal(
  estimateMessageCost(solLow, [...lunaSamples, sample({ ...solLow, costUsd: 0.02 })]),
  estimateUsageCost("gpt-6.1-sol", typical).costUsd
);

// --- More reasoning costs more; Sol costs more than Luna for the same use.
const low = estimateMessageCost(solLow, lunaSamples);
const medium = estimateMessageCost(solMedium, lunaSamples);
assert.ok(low !== null && medium !== null && medium > low);
assert.ok(low > 0.004);

// --- No history, or a model without price: no estimate.
assert.equal(estimateMessageCost(solLow, []), null);
assert.equal(estimateMessageCost({ modelId: "otro-modelo", reasoning: "low" }, lunaSamples), null);

console.log("agent cost estimate checks passed");
