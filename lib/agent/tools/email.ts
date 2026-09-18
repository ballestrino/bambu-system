import "server-only";

import { generateText, Output, tool } from "ai";
import { z } from "zod";

import { buildEmailDraftInstructions, buildEmailDraftPrompt } from "@/lib/agent/email-prompt";
import { validateEmailDraft } from "@/lib/agent/grounding";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import { resolveModelSpec } from "@/lib/ai/model-spec";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";
import { draftEmailInputSchema } from "@/schemas/agent-tools";

const draftSchema = z.object({
  subject: z.string().describe("Asunto del correo; vacío para WhatsApp"),
  body: z.string().describe("Cuerpo completo del mensaje"),
});

// Redacta con el modelo del modo actual y valida antes de devolver: solo
// importes con fuente en esta conversación y la nota de Literal E debajo de
// los precios. No envía nada ni toca el correo compartido.
export const createEmailTools = (ctx: AgentToolContext) => ({
  draftEmail: tool({
    description:
      "Redacta un correo o un WhatsApp para un cliente a partir de un brief. Solo acepta importes que salieron de una tool en esta conversación (presupuesto, precio oficial o cálculo) y exige la nota de Literal E debajo de los precios. Conseguí los importes antes de llamarla. No envía nada.",
    inputSchema: draftEmailInputSchema,
    execute: (input, { abortSignal }) =>
      runTool("draftEmail", async () => {
        const spec = resolveModelSpec(ctx.mode);
        const sources = [...ctx.grounding.evidence.values()];
        const result = await generateText({
          ...buildAgentCallSettings(spec, { actorId: ctx.actorId }),
          instructions: buildEmailDraftInstructions(input.channel),
          prompt: buildEmailDraftPrompt({
            brief: input.brief,
            to: input.to ?? undefined,
            subject: input.subject ?? undefined,
            allowedAmounts: [...ctx.grounding.amounts],
            sources,
          }),
          output: Output.object({ schema: draftSchema, name: "borrador" }),
          maxOutputTokens: 16_000,
          abortSignal,
        });

        // Se cobra aunque el borrador no pase la validación.
        ctx.usage.add({
          kind: "SKILL",
          modelId: spec.modelId,
          usage: normalizeUsage(result.totalUsage),
          gatewayCostUsd: result.steps.reduce<number | null>((total, step) => {
            const cost = readGatewayCost(step.providerMetadata);
            return cost === null ? total : (total ?? 0) + cost;
          }, null),
        });

        const draft = result.output;
        const check = validateEmailDraft(draft.body, ctx.grounding);
        if (!check.ok) return toolError(check.code, check.message);

        return toolOk({
          card: "email" as const,
          channel: input.channel,
          to: input.to ?? null,
          subject: input.channel === "email" ? draft.subject.trim() || input.subject || null : null,
          body: draft.body.trim(),
          sources: sources.map((source) => ({
            officialBudgetId: source.officialBudgetId,
            name: source.name,
            version: source.version,
            hasProducts: source.hasProducts,
          })),
          groundedAmounts: check.quotedAmounts,
        });
      }),
  }),
});
