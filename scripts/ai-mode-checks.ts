import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fromDbAgentMode, fromDbRecordedMode, toDbAgentMode } from "../lib/agent/conversation-mode";
import { formatModelLabel, formatUsageLine } from "../lib/agent/usage-format";
import {
  AGENT_MODE_IDS,
  AGENT_MODES,
  RETIRED_AGENT_MODES,
  formatAgentModeLabel,
  isAgentMode,
} from "../lib/ai/modes";
import { resolveDefaultMode, resolveModelSpec } from "../lib/ai/model-spec";
import { agentChatRequestSchema } from "../schemas/agent";

// Imported by check-ai-gateway.ts.

// --- Modes: Medio is Luna 6 xhigh, Alto is Sol 6 medium. Bajo is retired.
assert.deepEqual(AGENT_MODE_IDS, ["medio", "alto"]);
assert.deepEqual(Object.keys(AGENT_MODES), [...AGENT_MODE_IDS]);
assert.deepEqual(resolveModelSpec("medio", {}), {
  mode: "medio", provider: "openai", modelId: "gpt-6-luna", reasoning: "xhigh",
});
assert.deepEqual(resolveModelSpec("alto", {}), {
  mode: "alto", provider: "openai", modelId: "gpt-6-sol", reasoning: "medium",
});
assert.equal(resolveDefaultMode({}), "medio");
assert.equal(resolveDefaultMode({ AI_DEFAULT_MODE: " Alto " }), "alto");
["maximo", "bajo"].forEach((value) =>
  assert.throws(() => resolveDefaultMode({ AI_DEFAULT_MODE: value }), /AI_DEFAULT_MODE inválido/)
);
["extremo", "bajo"].forEach((mode) =>
  assert.throws(() => resolveModelSpec(mode as never, {}), /Modo de IA desconocido/)
);

// --- Overrides only touch their own mode, and blank values count as unset
// (the .env.template ships them empty). A leftover AI_MODEL_BAJO does nothing.
const overrides = {
  AI_MODEL_MEDIO: "gpt-6-sol", AI_REASONING_MEDIO: "HIGH", AI_MODEL_ALTO: "  ", AI_MODEL_BAJO: "gpt-5.6-luna", AI_PROVIDER: "",
};
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

// --- The route no longer takes a retired mode.
const turn = { id: "conv_12345678", message: { id: "user_1_abcdef", role: "user", parts: [{ type: "text", text: "Hola" }] } };
assert.equal(agentChatRequestSchema.safeParse({ ...turn, mode: "medio" }).success, true);
assert.equal(agentChatRequestSchema.safeParse({ ...turn, mode: "bajo" }).success, false);

// --- Retired modes: a conversation saved in Bajo continues in Medio, while
// messages and usage events keep the mode they were recorded with.
Object.keys(RETIRED_AGENT_MODES).forEach((id) => assert.equal(isAgentMode(id), false, id));
assert.equal(fromDbAgentMode("BAJO"), "medio");
assert.equal(fromDbAgentMode("ALTO"), "alto");
assert.equal(fromDbRecordedMode("BAJO"), "bajo");
assert.equal(toDbAgentMode("medio"), "MEDIO");
assert.deepEqual(["bajo", "medio", "alto"].map((mode) => formatAgentModeLabel(mode as never)), ["Bajo", "Medio", "Alto"]);
// The Prisma enum keeps every mode that history can name.
const dbModes = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8")
  .match(/enum AgentMode \{([^}]*)\}/)?.[1].split(/\s+/).filter(Boolean);
assert.deepEqual(
  dbModes?.sort(),
  [...AGENT_MODE_IDS, ...Object.keys(RETIRED_AGENT_MODES)].map((mode) => mode.toUpperCase()).sort()
);

// --- Model labels carry the generation, so the cost history tells the two
// Lunas apart.
assert.deepEqual(
  ["gpt-6-luna", "openai/gpt-6-sol", "gpt-5.6-luna", "openai/gpt-5.6-terra", "anthropic/claude-sonnet-5"].map(formatModelLabel),
  ["Luna 6", "Sol 6", "Luna 5.6", "Terra 5.6", "claude-sonnet-5"]
);
const tokens = { inputTokens: 900, outputTokens: 100, cachedInputTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0, total: 1000 };
const oldTurn = { modelId: "gpt-5.6-luna", tokens, costUsd: 0.0003, priced: true };
assert.equal(
  formatUsageLine(oldTurn, "bajo").replace(/\s/g, " "),
  "Luna 5.6 · Bajo · 1k tokens · US$ 0,0003"
);
