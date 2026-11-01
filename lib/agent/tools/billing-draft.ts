import "server-only";

import { tool } from "ai";

import { recordAgentAudit } from "@/lib/agent/audit";
import { BILLING_URL } from "@/lib/agent/billing-rule";
import { formatMonthLabel } from "@/lib/agent/month";
import { resolveBillingMonth } from "@/lib/agent/tools/billing-shared";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { getAgentDraftCard, writeAgentDraft } from "@/lib/billing/agent-draft-server";
import type { AgentDraftInput } from "@/lib/billing/agent-draft-store";
import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerReader, getBillerStatus, syncBillingPeriod } from "@/lib/billing/biller-server";
import { addBillingMonths, parseBillingPeriod } from "@/lib/billing/billing-month";
import { draftInvoicesInputSchema } from "@/schemas/agent-billing-tools";

// draftInvoices (docs/billing.md, "Agente"): crea o cambia el borrador del mes
// sin tarjeta de confirmación (un borrador no es fiscal: la confirmación es
// emitir, desde la página). Nunca emite: este módulo no importa la emisión y
// check:billing lo verifica.
export const createBillingDraftTools = (ctx: AgentToolContext) => ({
  draftInvoices: tool({
    description:
      "Crea o cambia el borrador de facturas de un mes: repetir lo emitido el mes anterior, desmarcar o marcar facturas, cambiar el detalle o el precio sin IVA de sus líneas y sumar e-Facturas para clientes nuevos por RUT. No emite: el borrador queda en Facturación para que una persona lo emita.",
    inputSchema: draftInvoicesInputSchema,
    execute: (input) =>
      runTool("draftInvoices", async () => {
        const status = getBillerStatus();
        if (!status.configured) return toolError("not_configured", status.message ?? "Biller no está configurado.");
        const month = resolveBillingMonth(ctx, input.month);
        const period = parseBillingPeriod(month);
        if (!period) return toolError("invalid_month", "Mes inválido");

        const repeat = input.repeatPreviousMonth === true;
        const additions: AgentDraftInput["additions"] = [];
        try {
          // Como "Repetir" en la página: lo ya facturado en el mes (también
          // desde el panel de Biller) tiene que arrancar desmarcado.
          if (repeat) {
            await syncBillingPeriod(period);
            await syncBillingPeriod(addBillingMonths(period, -1));
          }
          const reader = getBillerReader();
          for (const addition of input.newInvoices ?? []) {
            additions.push({ addition, rutData: await reader.lookupRut(addition.rut) });
          }
        } catch (error) {
          return toolError("biller_failed", describeBillerError(error));
        }

        const result = await writeAgentDraft({
          additions,
          changes: input.changes ?? [],
          conversationId: ctx.conversationId,
          period,
          repeat,
          userId: ctx.actorId,
        });
        if (!result.ok) return toolError("draft_rejected", result.error);

        const audit = (action: string) =>
          recordAgentAudit({
            actorId: ctx.actorId,
            action,
            entityType: "InvoiceBatch",
            entityId: result.batchId,
            metadata: { conversationId: ctx.conversationId, period: month, changes: result.notes.length, added: additions.length },
          });
        if (result.created) await audit("invoice_draft.create");
        if (result.notes.length) await audit("invoice_draft.update");

        const draft = await getAgentDraftCard(result.batchId);
        return toolOk({
          card: "billing-draft" as const,
          ...draft,
          created: result.created,
          monthLabel: formatMonthLabel(month),
          changes: result.notes,
          url: BILLING_URL,
          grounding: { amounts: [draft.subtotal, draft.total] },
        });
      }),
  }),
});
