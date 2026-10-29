import "server-only";

import { generateText, Output, tool } from "ai";
import { z } from "zod";

import { buildEmailDraftInstructions, buildEmailDraftPrompt } from "@/lib/agent/email-prompt";
import { selectQuotedSources, validateEmailDraft } from "@/lib/agent/grounding";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { formatLocalDateTime } from "@/lib/agent/visit-time";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import { resolveModelSpec } from "@/lib/ai/model-spec";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";
import { parseEmailRef } from "@/lib/mailbox/accounts";
import { readMailboxEmail, type EmailAddress, type MailboxEmail } from "@/lib/mailbox/read";
import { draftEmailInputSchema } from "@/schemas/agent-tools";

const draftSchema = z.object({
  subject: z.string().describe("Asunto del correo; vacío para WhatsApp"),
  body: z.string().describe("Cuerpo completo del mensaje"),
});

const formatAddress = (value: EmailAddress) =>
  value.name && value.address ? `${value.name} <${value.address}>` : (value.address ?? value.name ?? "");

// A quién va la respuesta: Reply-To o el remitente, salvo que sea una casilla
// nuestra (los pedidos del formulario de la web llegan desde contacto@ con el
// email del cliente en el texto): entonces el modelo tiene que mandarlo.
const replyRecipient = (email: MailboxEmail) => {
  const candidate = email.replyTo ?? email.from;
  const own = !candidate.address || candidate.address.endsWith(`@${email.mailboxAddress.split("@")[1]}`);
  return own ? null : formatAddress(candidate);
};

const replySubject = (subject: string) => (/^re:/i.test(subject) ? subject : `Re: ${subject}`);

// El correo que se responde, leído en vivo de la casilla: de ahí salen el
// destinatario, el asunto y el texto que el borrador contesta.
const loadReplyTarget = async (ref: string | null) => {
  if (!ref) return { ok: true, email: null } as const;
  const parsed = parseEmailRef(ref);
  if (!parsed) return { ok: false, error: "Ese ref no existe. Usá uno de listEmails." } as const;
  return readMailboxEmail(parsed);
};

const describeReply = (email: MailboxEmail) => ({
  ref: email.ref,
  mailbox: email.mailbox,
  mailboxAddress: email.mailboxAddress,
  from: formatAddress(email.from),
  subject: email.subject,
  when: email.date ? formatLocalDateTime(email.date) : null,
});

// Redacta con el modelo del modo actual y valida antes de devolver: solo
// importes con fuente en esta conversación y la nota de Literal E debajo de
// los precios. Con replyToRef responde ese correo. No envía nada ni toca las
// casillas.
export const createEmailTools = (ctx: AgentToolContext) => ({
  draftEmail: tool({
    description:
      "Redacta un correo o un WhatsApp para un cliente a partir de un brief. Para responder un correo de la casilla, mandá su ref en replyToRef: el borrador lo contesta y toma de él el destinatario y el asunto. Una llamada por respuesta: para varias respuestas o versiones, llamala varias veces. Solo acepta importes que salieron de una tool en esta conversación (presupuesto, precio oficial o cálculo) y exige la nota de Literal E debajo de los precios. Conseguí los importes antes de llamarla. No envía nada.",
    inputSchema: draftEmailInputSchema,
    execute: (input, { abortSignal }) =>
      runTool("draftEmail", async () => {
        const target = await loadReplyTarget(input.replyToRef);
        if (!target.ok) return toolError("reply_not_found", target.error);
        const reply = target.email ? describeReply(target.email) : null;
        const to = input.to ?? (target.email ? replyRecipient(target.email) : null);
        if (target.email && !to) {
          return toolError(
            "missing_recipient",
            "El correo viene de nuestra propia casilla (el formulario de la web): mandá en to el email del cliente que figura en el texto."
          );
        }
        const subject = input.subject ?? (reply ? replySubject(reply.subject) : null);

        const spec = resolveModelSpec(ctx.mode);
        const sources = [...ctx.grounding.evidence.values()];
        const result = await generateText({
          ...buildAgentCallSettings(spec, { actorId: ctx.actorId }),
          instructions: buildEmailDraftInstructions(input.channel, { replying: Boolean(reply) }),
          prompt: buildEmailDraftPrompt({
            brief: input.brief,
            to: to ?? undefined,
            subject: subject ?? undefined,
            allowedAmounts: [...ctx.grounding.amounts],
            sources,
            replyTo:
              reply && target.email
                ? { from: reply.from, subject: reply.subject, when: reply.when, body: target.email.body }
                : undefined,
          }),
          output: Output.object({ schema: draftSchema, name: "borrador" }),
          maxOutputTokens: 16_000,
          abortSignal,
        });

        // Se cobra aunque el borrador no pase la validación.
        ctx.usage.add({
          kind: "SKILL",
          modelId: spec.modelId,
          reasoning: spec.reasoning,
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
          to,
          // Una respuesta conserva el asunto del hilo.
          subject: input.channel === "email" ? (reply ? subject : draft.subject.trim() || subject || null) : null,
          replyTo: reply,
          body: draft.body.trim(),
          sources: selectQuotedSources(sources, check.quotedAmounts).map((source) => ({
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
