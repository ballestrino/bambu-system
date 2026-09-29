import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fromDbAgentMode, fromDbRecordedMode, toDbAgentMode } from "../lib/agent/conversation-mode";
import { formatModelLabel, formatUsageLine } from "../lib/agent/usage-format";
import {
  AGENT_MODE_IDS,
  AGENT_MODES,
  formatAgentModeLabel,
  isAgentMode,
} from "../lib/ai/modes";
import { resolveDefaultMode, resolveModelSpec } from "../lib/ai/model-spec";
import { agentChatRequestSchema } from "../schemas/agent";

// Imported by check-ai-gateway.ts.

// --- Three active modes, with Bajo as the default.
assert.deepEqual(AGENT_MODE_IDS, ["bajo", "medio", "alto"]);
assert.deepEqual(Object.keys(AGENT_MODES), [...AGENT_MODE_IDS]);
assert.deepEqual(resolveModelSpec("bajo", {}), {
  mode: "bajo", provider: "openai", modelId: "gpt-6-luna", reasoning: "xhigh",
});
assert.deepEqual(resolveModelSpec("medio", {}), {
  mode: "medio", provider: "openai", modelId: "gpt-6.1-sol", reasoning: "low",
});
assert.deepEqual(resolveModelSpec("alto", {}), {
  mode: "alto", provider: "openai", modelId: "gpt-6.1-sol", reasoning: "medium",
});
assert.equal(resolveDefaultMode({}), "bajo");
assert.equal(resolveDefaultMode({ AI_DEFAULT_MODE: " Alto " }), "alto");
AGENT_MODE_IDS.forEach((mode) => {
  assert.equal(isAgentMode(mode), true);
  assert.equal(resolveDefaultMode({ AI_DEFAULT_MODE: mode }), mode);
});
["maximo", "retirado"].forEach((value) =>
  assert.throws(() => resolveDefaultMode({ AI_DEFAULT_MODE: value }), /AI_DEFAULT_MODE inválido/)
);
["extremo", "retirado"].forEach((mode) =>
  assert.throws(() => resolveModelSpec(mode as never, {}), /Modo de IA desconocido/)
);

// --- Overrides only touch their own mode, and blank values count as unset
// (the .env.template ships them empty). Bajo overrides are active again.
const overrides = {
  AI_MODEL_MEDIO: "gpt-6-sol", AI_REASONING_MEDIO: "HIGH", AI_MODEL_ALTO: "  ", AI_MODEL_BAJO: "gpt-5.6-luna", AI_REASONING_BAJO: "low", AI_PROVIDER: "",
};
assert.deepEqual(resolveModelSpec("bajo", overrides), {
  mode: "bajo", provider: "openai", modelId: "gpt-5.6-luna", reasoning: "low",
});
assert.deepEqual(resolveModelSpec("medio", overrides), {
  mode: "medio", provider: "openai", modelId: "gpt-6-sol", reasoning: "high",
});
assert.deepEqual(resolveModelSpec("alto", overrides), resolveModelSpec("alto", {}));
assert.throws(() => resolveModelSpec("alto", { AI_REASONING_ALTO: "maximo" }), /AI_REASONING_ALTO inválido/);
assert.throws(() => resolveModelSpec("alto", { AI_PROVIDER: "anthropic" }), /AI_PROVIDER inválido/);
assert.throws(
  () => resolveModelSpec("alto", { AI_MODEL_ALTO: "anthropic/claude-sonnet-5" }),
  /AI_PROVIDER=gateway/
);

// --- The route accepts all three modes and rejects unknown values.
const turn = { id: "conv_12345678", message: { id: "user_1_abcdef", role: "user", parts: [{ type: "text", text: "Hola" }] } };
AGENT_MODE_IDS.forEach((mode) =>
  assert.equal(agentChatRequestSchema.safeParse({ ...turn, mode }).success, true)
);
assert.equal(agentChatRequestSchema.safeParse({ ...turn, mode: "extremo" }).success, false);

// --- Saved selections and usage events retain their recorded mode.
assert.equal(fromDbAgentMode("BAJO"), "bajo");
assert.equal(fromDbAgentMode("MEDIO"), "medio");
assert.equal(fromDbAgentMode("ALTO"), "alto");
assert.equal(fromDbRecordedMode("BAJO"), "bajo");
assert.equal(toDbAgentMode("medio"), "MEDIO");
assert.equal(toDbAgentMode("bajo"), "BAJO");
assert.deepEqual(["bajo", "medio", "alto"].map((mode) => formatAgentModeLabel(mode as never)), ["Bajo", "Medio", "Alto"]);
// The Prisma enum keeps every mode that history can name.
const dbModes = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8")
  .match(/enum AgentMode \{([^}]*)\}/)?.[1].split(/\s+/).filter(Boolean);
assert.deepEqual(
  dbModes?.sort(),
  AGENT_MODE_IDS.map((mode) => mode.toUpperCase()).sort()
);

// --- Model labels carry the generation, so the cost history tells the two
// Lunas apart.
assert.deepEqual(
  ["gpt-6-luna", "openai/gpt-6-sol", "gpt-6.1-sol", "openai/gpt-6.1-sol", "gpt-5.6-luna", "openai/gpt-5.6-terra", "anthropic/claude-sonnet-5"].map(formatModelLabel),
  ["Luna 6", "Sol 6", "Sol 6.1", "Sol 6.1", "Luna 5.6", "Terra 5.6", "claude-sonnet-5"]
);
const tokens = { inputTokens: 900, outputTokens: 100, cachedInputTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0, total: 1000 };
const oldTurn = { modelId: "gpt-5.6-luna", tokens, costUsd: 0.0003, priced: true };
assert.equal(
  formatUsageLine(oldTurn, "bajo").replace(/\s/g, " "),
  "Luna 5.6 · Bajo · 1k tokens · US$ 0,0003"
);
