import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { getAgentWebForm } from "@/data/agent/web-forms";
import { validateEmailDraft } from "@/lib/agent/grounding";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";

const NO_FORM = "Esto solo funciona en Formularios con un formulario elegido. Pedile al usuario que abra uno.";

const fillWebFormReplyInputSchema = z.object({
  subject: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .describe("Asunto nuevo, o null para dejar el que está (el de la pantalla ya dice el servicio pedido)"),
  body: z
    .string()
    .trim()
    .min(2)
    .max(10000)
    .describe(
      "La respuesta completa en Markdown: empieza con el saludo (Hola <nombre>,), **negrita**, *cursiva*, listas con - o 1. y una línea en blanco entre párrafos. Sin firma ni cita: se agregan solas."
    ),
});

// Formularios web (feature 75): escribe la respuesta en el campo Mensaje del
// formulario que el usuario mira. No manda nada: la página reemplaza el campo
// y la persona revisa y toca Enviar. Los importes, como en draftEmail, tienen
// que tener fuente en la conversación.
export const createWebFormReplyTools = (ctx: AgentToolContext) => ({
  fillWebFormReply: tool({
    description:
      "Pone una respuesta en el campo Mensaje (y opcionalmente el asunto) del formulario web que el usuario tiene abierto en Formularios, reemplazando lo que había. No envía: el usuario revisa y toca Enviar. Solo acepta importes con fuente en esta conversación.",
    inputSchema: fillWebFormReplyInputSchema,
    execute: (input) =>
      runTool("fillWebFormReply", async () => {
        if (!ctx.webFormId) return toolError("no_form", NO_FORM);
        const form = await getAgentWebForm(ctx.webFormId);
        if (!form) return toolError("no_form", "El formulario de esta conversación ya no existe.");
        const check = validateEmailDraft(input.body, ctx.grounding);
        if (!check.ok) return toolError(check.code, check.message);
        return toolOk({
          card: "web-form-reply" as const,
          formId: form.id,
          name: form.name,
          to: form.email,
          subject: input.subject || null,
          body: input.body,
          groundedAmounts: check.quotedAmounts,
        });
      }),
  }),
});
