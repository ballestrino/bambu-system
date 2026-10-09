import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prepareHistoryForModel } from "../lib/agent/model-history";
import type { AgentUIMessage } from "../lib/agent/messages";
import { buildAgentCallSettings } from "../lib/ai/call-settings";
import { AGENT_MODEL_CHOICES, defaultModeForChoice, findModelChoice } from "../lib/ai/model-choices";
import { hasProviderCredentials, resolveModelSpec } from "../lib/ai/model-spec";
import { estimateUsageCost } from "../lib/ai/pricing";
import { getAnthropicProvider } from "../lib/ai/providers";
import { getAiSafetyIdentifier } from "../lib/ai/safety-identifier";
import { EMPTY_USAGE } from "../lib/ai/usage";

// Imported by check-ai-gateway.ts. Runs before its environment cleanup, so
// every check passes its env explicitly.

// --- Claude modes: Haiku 5.5 with high and xhigh, Sonnet 5.5 with high and
// Opus 5.5 with medium, straight to Anthropic or through the gateway.
assert.deepEqual(resolveModelSpec("haiku_high", {}), {
  mode: "haiku_high", provider: "anthropic", modelId: "claude-haiku-5-5", reasoning: "high",
});
assert.equal(resolveModelSpec("haiku_xhigh", {}).reasoning, "xhigh");
assert.deepEqual(
  [resolveModelSpec("sonnet_high", {}), resolveModelSpec("opus_medium", {})].map(({ modelId, reasoning }) => [modelId, reasoning]),
  [["claude-sonnet-5-5", "high"], ["claude-opus-5-5", "medium"]]
);
const gateway = resolveModelSpec("haiku_high", { AI_PROVIDER: "gateway" });
assert.deepEqual([gateway.provider, gateway.modelId], ["gateway", "anthropic/claude-haiku-5-5"]);
assert.throws(() => resolveModelSpec("haiku_high", { AI_MODEL_HAIKU_HIGH: "anthropic/claude-haiku-5-5" }), /AI_PROVIDER=gateway/);

// --- The picker: models with their efforts, Haiku 5.5 Alto recommended.
assert.deepEqual(
  AGENT_MODEL_CHOICES.map((choice) => [choice.label, choice.modes.map((mode) => resolveModelSpec(mode, {}).reasoning)]),
  [
    ["Haiku 5.5", ["high", "xhigh"]],
    ["Sonnet 5.5", ["high"]],
    ["Opus 5.5", ["medium"]],
    ["Luna 6", ["xhigh"]],
    ["Sol 6.1", ["low", "medium"]],
  ]
);
assert.equal(defaultModeForChoice(findModelChoice("haiku_xhigh")), "haiku_high");
assert.equal(defaultModeForChoice(findModelChoice("alto")), "medio");

// --- Credentials: a mode without its vendor key is shown disabled.
assert.equal(hasProviderCredentials("anthropic", {}), false);
assert.equal(hasProviderCredentials("anthropic", { ANTHROPIC_API_KEY: "key" }), true);
assert.equal(hasProviderCredentials("openai", { ANTHROPIC_API_KEY: "key" }), false);
assert.equal(hasProviderCredentials("gateway", { VERCEL: "1" }), true);

// --- Prices from platform.claude.com (2026-10-09). 8,000 uncached + 2,000
// cached + 1,000 output; Opus and Sonnet 5.5 read cache at 0.05x input.
const usage = { ...EMPTY_USAGE, inputTokens: 10_000, cachedInputTokens: 2_000, outputTokens: 1_000, reasoningTokens: 400 };
assert.deepEqual(estimateUsageCost("claude-haiku-5-5", usage, {}), { costUsd: 0.00132, priced: true });
assert.deepEqual(estimateUsageCost("anthropic/claude-haiku-5-5", usage, {}), { costUsd: 0.00132, priced: true });
assert.deepEqual(estimateUsageCost("claude-sonnet-5-5", usage, {}), { costUsd: 0.0262, priced: true });
assert.deepEqual(estimateUsageCost("claude-opus-5-5", usage, {}), { costUsd: 0.0524, priced: true });
// 5-minute cache writes cost 1.25x input.
assert.deepEqual(
  estimateUsageCost("claude-opus-5-5", { ...EMPTY_USAGE, inputTokens: 1e6, cacheWriteTokens: 1e6 }, {}),
  { costUsd: 5, priced: true }
);

// --- Call settings: effort, summarized adaptive thinking that drops a stale
// block instead of failing, no parallel tools, prompt caching and the
// pseudonymous user id. Opus and Sonnet 5.5 fall back on a refusal.
const previousKey = process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
assert.throws(() => getAnthropicProvider(), /Falta configurar ANTHROPIC_API_KEY/);
process.env.ANTHROPIC_API_KEY = "sk-ant-check-not-a-real-key";
const haiku = buildAgentCallSettings(resolveModelSpec("haiku_xhigh", {}), { actorId: "user-1" });
assert.equal(haiku.model.provider, "anthropic.messages");
assert.equal(haiku.model.modelId, "claude-haiku-5-5");
assert.deepEqual(haiku.providerOptions.anthropic, {
  thinking: { type: "adaptive", display: "summarized", blockBinding: { prefixMismatchBehavior: "drop_block" } },
  effort: "xhigh",
  disableParallelToolUse: true,
  cacheControl: { type: "ephemeral" },
  metadata: { userId: getAiSafetyIdentifier("agent", "user-1") },
});
const opus = buildAgentCallSettings(resolveModelSpec("opus_medium", {}), { actorId: "user-1" });
assert.equal(opus.providerOptions.anthropic?.effort, "medium");
assert.equal(opus.providerOptions.anthropic?.fallbacks, "default");
assert.equal(buildAgentCallSettings(resolveModelSpec("sonnet_high", {}), { actorId: "user-1" }).providerOptions.anthropic?.fallbacks, "default");
// OpenAI calls carry no Anthropic options.
process.env.OPENAI_API_KEY ??= "sk-check-not-a-real-key";
assert.equal("anthropic" in buildAgentCallSettings(resolveModelSpec("bajo", {}), { actorId: "user-1" }).providerOptions, false);
if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
else process.env.ANTHROPIC_API_KEY = previousKey;

// --- History: Claude never gets earlier turns' thinking (the agent's history
// is not append-only); OpenAI gets its own reasoning but not Claude's.
const reasoning = (vendor: "anthropic" | "openai") => ({
  type: "reasoning" as const,
  text: `pensé con ${vendor}`,
  providerMetadata: { [vendor]: { signature: "sig" } },
});
const history = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "Hola" }] },
  { id: "a1", role: "assistant", parts: [reasoning("anthropic"), reasoning("openai"), { type: "text", text: "Listo" }] },
  { id: "u2", role: "user", parts: [{ type: "text", text: "¿Y?" }] },
] as AgentUIMessage[];
const partTypes = (messages: AgentUIMessage[]) =>
  messages.map((message) => message.parts.map((part) => (part.type === "reasoning" ? part.text : part.type)));
assert.deepEqual(partTypes(prepareHistoryForModel(history, "claude-haiku-5-5")), [["text"], ["text"], ["text"]]);
assert.deepEqual(partTypes(prepareHistoryForModel(history, "anthropic/claude-opus-5-5")), [["text"], ["text"], ["text"]]);
assert.deepEqual(partTypes(prepareHistoryForModel(history, "gpt-6-luna")), [["text"], ["pensé con openai", "text"], ["text"]]);
assert.equal(prepareHistoryForModel(history, "gpt-6-luna")[0], history[0]);
assert.match(
  readFileSync(join(process.cwd(), "lib/agent/run.ts"), "utf8"),
  /inlineHistoryImages\(prepareHistoryForModel\(input\.messages, spec\.modelId\)/
);
