import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { generateText, LanguageModelUsage } from "ai";

import { buildAgentCallSettings } from "../lib/ai/call-settings";
import { resolveModelSpec, resolveTitleModelSpec } from "../lib/ai/model-spec";
import { MODEL_PRICES, estimateUsageCost, formatUsd, getPriceEnvKey } from "../lib/ai/pricing";
import { getGatewayProvider, getOpenAIProvider, hasGatewayCredentials, resolveLanguageModel } from "../lib/ai/providers";
import { getAiSafetyIdentifier } from "../lib/ai/safety-identifier";
import { EMPTY_USAGE, normalizeUsage, readGatewayCost, sumUsage } from "../lib/ai/usage";
import { getMailSafetyIdentifier } from "../lib/mail-agent/openai-client";

import "./ai-mode-checks";
import "./ai-claude-checks";

// The check must not depend on the developer's shell or real credentials.
["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "AI_GATEWAY_API_KEY", "VERCEL", "VERCEL_OIDC_TOKEN"].forEach(
  (key) => delete process.env[key]
);

// --- Gateway: bare ids get the openai/ prefix, other vendors pass through.
// Switching vendors is an environment change only.
const gatewayEnv = { AI_PROVIDER: "Gateway", AI_MODEL_ALTO: "anthropic/claude-sonnet-5" };
assert.equal(resolveModelSpec("bajo", gatewayEnv).modelId, "openai/gpt-6-luna");
assert.equal(resolveModelSpec("medio", gatewayEnv).modelId, "openai/gpt-6.1-sol");
assert.equal(resolveModelSpec("alto", gatewayEnv).modelId, "anthropic/claude-sonnet-5");
assert.equal(resolveModelSpec("alto", gatewayEnv).provider, "gateway");

// --- Title: a small task, Luna 6 with medium reasoning. Its output tokens
// leave room for that reasoning.
assert.deepEqual(resolveTitleModelSpec({}), {
  provider: "openai", modelId: "gpt-6-luna", reasoning: "medium",
});
assert.equal(resolveTitleModelSpec(gatewayEnv).modelId, "openai/gpt-6-luna");
assert.match(
  readFileSync(join(process.cwd(), "lib/agent/conversation-title.ts"), "utf8"),
  /TITLE_MAX_OUTPUT_TOKENS = 8_000;/
);

// --- Safety identifier: the mail namespace stays byte-identical to the mail
// agent's, and the agent namespace never collides with it.
["user-1", "shared-mail-sync"].forEach((actorId) =>
  assert.equal(getAiSafetyIdentifier("mail", actorId), getMailSafetyIdentifier(actorId))
);
assert.notEqual(getAiSafetyIdentifier("agent", "user-1"), getAiSafetyIdentifier("mail", "user-1"));
assert.match(getAiSafetyIdentifier("agent", "user-1"), /^[0-9a-f]{64}$/);

// --- Providers: importing them above read no keys; the first use fails in
// Spanish when a key is missing and works once it exists.
assert.throws(() => getOpenAIProvider(), /Falta configurar OPENAI_API_KEY/);
assert.throws(() => getGatewayProvider(), /Falta configurar AI_GATEWAY_API_KEY/);
// Without a key, the Vercel OIDC token (deploys, or vercel env pull) is enough.
[{ VERCEL_OIDC_TOKEN: "oidc" }, { VERCEL: "1" }, { AI_GATEWAY_API_KEY: "key" }].forEach((env) => assert.equal(hasGatewayCredentials(env), true));
assert.equal(hasGatewayCredentials({ AI_GATEWAY_API_KEY: "  " }), false);
process.env.OPENAI_API_KEY = "sk-check-not-a-real-key";
process.env.AI_GATEWAY_API_KEY = "gateway-check-not-a-real-key";
assert.equal(
  resolveLanguageModel(resolveModelSpec("alto", gatewayEnv)).modelId,
  "anthropic/claude-sonnet-5"
);

// --- Shared call settings.
const settings = buildAgentCallSettings(resolveModelSpec("medio", {}), { actorId: "user-1" });
assert.equal(settings.model.provider, "openai.responses");
assert.equal(settings.model.modelId, "gpt-6.1-sol");
assert.equal(settings.reasoning, "low");
assert.equal("temperature" in settings, false);
assert.deepEqual(settings.providerOptions.openai, {
  store: false,
  safetyIdentifier: getAiSafetyIdentifier("agent", "user-1"),
  parallelToolCalls: false,
});
// Compile time: the settings spread straight into an SDK call.
const callOptions: Parameters<typeof generateText>[0] = { ...settings, prompt: "ping" };
assert.equal(callOptions.reasoning, "low");
for (const mode of ["bajo", "medio", "alto"] as const) {
  const spec = resolveModelSpec(mode, {});
  const modeSettings = buildAgentCallSettings(spec, { actorId: "user-1" });
  assert.equal(modeSettings.model.modelId, spec.modelId);
  assert.equal(modeSettings.reasoning, spec.reasoning);
}

// --- Normalized usage from the v7 shape, where cached and reasoning tokens
// are nested.
const sdkUsage: LanguageModelUsage = {
  inputTokens: 1_200,
  inputTokenDetails: { noCacheTokens: 650, cacheReadTokens: 500, cacheWriteTokens: 50 },
  outputTokens: 300,
  outputTokenDetails: { textTokens: 100, reasoningTokens: 200 },
  totalTokens: 1_500,
};
const turn = normalizeUsage(sdkUsage);
assert.deepEqual(turn, {
  inputTokens: 1_200, outputTokens: 300, cachedInputTokens: 500, cacheWriteTokens: 50, reasoningTokens: 200,
});
assert.deepEqual(normalizeUsage(undefined), EMPTY_USAGE);
assert.deepEqual(sumUsage(turn, turn), {
  inputTokens: 2_400, outputTokens: 600, cachedInputTokens: 1_000, cacheWriteTokens: 100, reasoningTokens: 400,
});
assert.deepEqual(sumUsage(), EMPTY_USAGE);

// --- Cost in USD from the Standard prices per million tokens (Claude ones
// are checked in ai-claude-checks.ts).
assert.deepEqual(
  Object.keys(MODEL_PRICES).sort(),
  ["gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-luna", "gpt-6-sol", "gpt-6.1-sol", "claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"].sort()
);
const usage = {
  ...EMPTY_USAGE, inputTokens: 10_000, cachedInputTokens: 2_000, outputTokens: 1_000, reasoningTokens: 400,
};
// 8,000 uncached x 2 + 2,000 cached x 0.2 + 1,000 output x 12 = 28,400 micro-USD.
// Reasoning is already inside outputTokens and is not billed twice.
assert.deepEqual(estimateUsageCost("gpt-5.6-terra", usage, {}), { costUsd: 0.0284, priced: true });
assert.deepEqual(estimateUsageCost("openai/gpt-5.6-terra", usage, {}), { costUsd: 0.0284, priced: true });
// Historic models retain their prices; Sol 6.1 has a lower cache-read price.
assert.deepEqual(estimateUsageCost("gpt-6-luna", usage, {}), { costUsd: 0.00132, priced: true });
assert.deepEqual(estimateUsageCost("openai/gpt-6-sol", usage, {}), { costUsd: 0.0264, priced: true });
assert.deepEqual(estimateUsageCost("gpt-6.1-sol", usage, {}), { costUsd: 0.0262, priced: true });
assert.deepEqual(estimateUsageCost("openai/gpt-6.1-sol", usage, {}), { costUsd: 0.0262, priced: true });
assert.deepEqual(
  estimateUsageCost("gpt-5.6-sol", { ...EMPTY_USAGE, inputTokens: 1e6, outputTokens: 1e6 }, {}),
  { costUsd: 24, priced: true }
);
// Cache writes cost 1.25x input and are not billed again as uncached input.
assert.deepEqual(
  estimateUsageCost("gpt-5.6-luna", { ...EMPTY_USAGE, inputTokens: 1e6, cacheWriteTokens: 2e5 }, {}),
  { costUsd: 0.21, priced: true }
);
// Unpriced models keep their tokens and say so instead of inventing a cost.
// "constructor" guards against reading inherited keys of the price table.
["anthropic/claude-sonnet-5", "constructor"].forEach((modelId) =>
  assert.deepEqual(estimateUsageCost(modelId, usage, {}), { costUsd: null, priced: false })
);

// --- Price overrides by environment.
assert.equal(getPriceEnvKey("openai/gpt-5.6-terra"), "AI_PRICE_OPENAI_GPT_5_6_TERRA");
assert.deepEqual(
  estimateUsageCost("anthropic/claude-sonnet-5", usage, {
    AI_PRICE_ANTHROPIC_CLAUDE_SONNET_5: "3, 0.3, 15, 3.75",
  }),
  { costUsd: 0.0396, priced: true }
);
assert.deepEqual(
  estimateUsageCost("gpt-5.6-terra", usage, { AI_PRICE_GPT_5_6_TERRA: "1,0.1,6" }),
  { costUsd: 0.0142, priced: true }
);
// Without the fourth value, cache writes cost 1.25x input, as in gpt-5.6: the
// real Terra prices as three values price like the table.
const withWrites = { ...usage, cacheWriteTokens: 1_000 };
assert.deepEqual(
  estimateUsageCost("gpt-5.6-terra", withWrites, { AI_PRICE_GPT_5_6_TERRA: "2,0.2,12" }),
  estimateUsageCost("gpt-5.6-terra", withWrites, {})
);
// Empty fields, a trailing comma, hex or exponents are typos, never a zero price.
["1;0.1;6", "1,0.1", "a,b,c", "-1,0,1", "1,0,0,1,2", ",,", "1,,6", "1,0.1,6,", "0x10,0,1", "1e3,0,1"].forEach((value) =>
  assert.throws(
    () => estimateUsageCost("gpt-5.6-terra", usage, { AI_PRICE_GPT_5_6_TERRA: value }),
    /AI_PRICE_GPT_5_6_TERRA inválido/
  )
);

// --- Real cost reported by the AI Gateway, when present.
assert.equal(readGatewayCost({ gateway: { cost: "0.0012" } }), 0.0012);
assert.equal(readGatewayCost({ gateway: { cost: 0.5 } }), 0.5);
[{ gateway: { generationId: "gen_1" } }, { gateway: { cost: "" } }, { gateway: { cost: "n/a" } }, undefined]
  .forEach((metadata) => assert.equal(readGatewayCost(metadata), null));

// --- USD formatting never hides a cheap turn as zero.
const usd = (value: number) => formatUsd(value).replace(/\s/g, " ");
assert.equal(usd(0.0284), "US$ 0,03");
assert.equal(usd(0.0012), "US$ 0,0012");
assert.equal(usd(0.00001), "< US$ 0,0001");
assert.equal(usd(0), "US$ 0,00");
assert.equal(usd(1234.5), "US$ 1.234,50");

// --- Source text: providers are created inside the getters, never at module
// scope, and pure modules take only types from the SDK.
const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const providers = source("lib/ai/providers.ts");
assert.doesNotMatch(providers, /^(export )?(const|let|var) \w+\s*=\s*create(OpenAI|Gateway)\(/m);
assert.doesNotMatch(providers, /import\s*\{[^}]*\b(openai|gateway)\b[^}]*\}/);
assert.match(providers, /openAIProvider \?\?= createOpenAI\(/);
assert.match(providers, /gatewayProvider \?\?= createGateway\(/);
["lib/ai/modes.ts", "lib/ai/model-spec.ts", "lib/ai/pricing.ts", "lib/ai/usage.ts"].forEach(
  (path) => assert.doesNotMatch(source(path), /^import (?!type )[^;]*from "(ai|@ai-sdk\/[^"]+)"/m, path)
);

console.log("AI gateway checks passed");
