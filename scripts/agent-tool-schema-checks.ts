import assert from "node:assert/strict";

import { asSchema, tool } from "ai";
import { z } from "zod";

import { compactJsonSchema, compactToolSchemas } from "../lib/agent/tool-schema-compact";

// Imported by check-agent-tools.ts. The tool definitions go in every step:
// the compact JSON drops what zod repeats but accepts the same input, and the
// validation is still zod's.
assert.deepEqual(
  compactJsonSchema({
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      visits: { anyOf: [{ type: "integer", minimum: 0, maximum: Number.MAX_SAFE_INTEGER }, { type: "null" }], description: "Visitas" },
      kind: { anyOf: [{ type: "string", enum: ["week", "month"] }, { type: "null" }] },
      either: { anyOf: [{ type: "string" }, { type: "number" }] },
    },
    required: ["visits", "kind", "either"],
    additionalProperties: false,
  }),
  {
    type: "object",
    properties: {
      visits: { type: ["integer", "null"], minimum: 0, description: "Visitas" },
      kind: { type: ["string", "null"], enum: ["week", "month", null] },
      either: { anyOf: [{ type: "string" }, { type: "number" }] },
    },
    required: ["visits", "kind", "either"],
    additionalProperties: false,
  }
);

const probe = compactToolSchemas({
  probe: tool({
    description: "probe",
    inputSchema: z.object({ visits: z.number().int().min(0).nullable() }),
    execute: async () => "ok",
  }),
});
const schema = asSchema(probe.probe.inputSchema);
void (async () => {
  assert.equal("$schema" in (await schema.jsonSchema), false);
  assert.equal((await schema.validate!({ visits: 3 })).success, true);
  assert.equal((await schema.validate!({ visits: -1 })).success, false);
  assert.equal((await schema.validate!({})).success, false);
})();
