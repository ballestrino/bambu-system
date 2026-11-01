import "server-only";

import { tool } from "ai";

import { resolveBillingMonth } from "@/lib/agent/tools/billing-shared";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { prepareAgentCreditNote, suggestAgentReceiverJobs } from "@/lib/billing/agent-corrections-read";
import { parseBillingPeriod } from "@/lib/billing/billing-month";
import { billingMonthInputSchema, prepareCreditNoteInputSchema } from "@/schemas/agent-billing-tools";

// Corregir y vincular (feature 43). Ninguna tool escribe: la nota de crédito
// la emite el usuario desde su página y el vínculo receptor → trabajo lo
// confirma en Facturación. Este módulo no importa la emisión (check:billing).
export const createBillingCorrectionTools = (ctx: AgentToolContext) => ({
  prepareCreditNote: tool({
    description:
      "Prepara una nota de crédito de una factura emitida, por el total (la anula) o parcial (monto sin IVA por línea), con la razón, y devuelve el enlace a su página para que el usuario la revise y la emita. No emite nada.",
    inputSchema: prepareCreditNoteInputSchema,
    execute: (input) =>
      runTool("prepareCreditNote", async () => {
        const request = input.mode === "full"
          ? { mode: "full" as const }
          : { lines: input.lines ?? [], mode: "partial" as const };
        const result = await prepareAgentCreditNote(input.invoiceId, request, input.reason);
        if (!result.ok) return toolError("credit_note_rejected", result.error);
        const { ok, ...note } = result;
        void ok;
        return toolOk({ card: "billing-credit-note" as const, ...note, grounding: { amounts: [note.subtotal, note.total] } });
      }),
  }),

  suggestReceiverJobs: tool({
    description:
      "Para los receptores de las facturas de un mes (el borrador o, si no hay, lo emitido): su trabajo de Bambú vinculado o los trabajos que más se le parecen por nombre. No vincula: el usuario confirma cada vínculo en Facturación (¿Es …? Vincular).",
    inputSchema: billingMonthInputSchema,
    execute: (input) =>
      runTool("suggestReceiverJobs", async () => {
        const period = parseBillingPeriod(resolveBillingMonth(ctx, input.month));
        if (!period) return toolError("invalid_month", "Mes inválido");
        return toolOk({ card: "receiver-jobs" as const, ...(await suggestAgentReceiverJobs(period)) });
      }),
  }),
});
