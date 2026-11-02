import "server-only";

import { generateText, Output } from "ai";

import { summarizeUsage, type UsageEntry } from "@/lib/agent/usage-collector";
import { formatModelWithReasoning } from "@/lib/agent/usage-format";
import { persistUsageEntries } from "@/lib/agent/usage-store";
import { buildAgentCallSettings } from "@/lib/ai/call-settings";
import { resolveDefaultMode, resolveModelSpec } from "@/lib/ai/model-spec";
import { normalizeUsage, readGatewayCost } from "@/lib/ai/usage";
import { addBillingMonths, getBillingPeriodKey } from "@/lib/billing/billing-month";
import { getBillingMonthName } from "@/lib/billing/billing-month-text";
import {
  buildReviewInstructions,
  buildReviewPrompt,
  reviewOutputSchema,
  validateReviewSuggestions,
  type ReviewRow,
} from "@/lib/billing/draft-review";
import { getReceiverName, readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getCfeLabel } from "@/lib/billing/invoice-mapping";
import { getLineSubtotal } from "@/lib/billing/invoice-totals";
import { getReceiverKey } from "@/lib/billing/receiver-job";
import { db } from "@/lib/db";

const HISTORY_MONTHS = 6;
const ISSUED = ["ISSUING", "ISSUED", "ACCEPTED", "UNKNOWN"] as const;

// En cuántos de los últimos meses se le facturó a cada cliente (por la clave
// del vínculo con el trabajo: documento, nombre o título).
const loadMonthsBilled = async (period: Date) => {
  const invoices = await db.invoice.findMany({
    where: { issueDate: { gte: addBillingMonths(period, -HISTORY_MONTHS), lt: period }, status: { in: [...ISSUED] } },
    select: { issueDate: true, label: true, receiver: true },
  });
  const months = new Map<string, Set<string>>();
  for (const invoice of invoices) {
    const key = getReceiverKey(readStoredReceiver(invoice.receiver), invoice.label);
    if (!key || !invoice.issueDate) continue;
    months.set(key, (months.get(key) ?? new Set()).add(invoice.issueDate.toISOString().slice(0, 7)));
  }
  return months;
};

// Lee las facturas en borrador del mes, le pide al modelo las sugerencias y
// las valida. No escribe nada del borrador: solo el consumo de IA.
export const reviewDraftWithAi = async (period: Date, actorId: string) => {
  const batch = await db.invoiceBatch.findFirst({
    where: { period, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    select: {
      invoices: {
        where: { archivedAt: null, status: "DRAFT" },
        select: {
          adenda: true, cfeType: true, id: true, items: true, label: true, receiver: true,
          sourceInvoice: { select: { adenda: true, items: true } },
        },
      },
    },
  });
  if (!batch) return { error: "No hay un borrador para revisar en este mes" as const };
  if (!batch.invoices.length) return { error: "El borrador no tiene facturas para revisar" as const };

  const billed = await loadMonthsBilled(period);
  const rows: ReviewRow[] = batch.invoices.map((invoice) => {
    const receiver = readStoredReceiver(invoice.receiver);
    const key = getReceiverKey(receiver, invoice.label);
    return {
      adenda: invoice.adenda,
      cfeLabel: getCfeLabel(invoice.cfeType),
      id: invoice.id,
      lines: (readStoredItems(invoice.items) ?? []).map((item) => ({ concepto: item.concepto, subtotal: getLineSubtotal(item) })),
      monthsBilled: key ? billed.get(key)?.size ?? 0 : null,
      name: getReceiverName(receiver, invoice.label),
      sourceAdenda: invoice.sourceInvoice?.adenda ?? null,
      sourceConcepts: (readStoredItems(invoice.sourceInvoice?.items) ?? []).map((item) => item.concepto),
    };
  });

  const draftMonth = `${getBillingMonthName(period)} ${period.getUTCFullYear()}`;
  const previous = addBillingMonths(period, -1);
  const serviceMonth = `${getBillingMonthName(previous)} ${previous.getUTCFullYear()}`;
  const mode = resolveDefaultMode();
  const spec = resolveModelSpec(mode);
  const result = await generateText({
    ...buildAgentCallSettings(spec, { actorId }),
    instructions: buildReviewInstructions(draftMonth, serviceMonth),
    prompt: buildReviewPrompt(rows),
    output: Output.object({ schema: reviewOutputSchema, name: "revision" }),
    maxOutputTokens: 16_000,
  });

  const entries: UsageEntry[] = [{
    kind: "SKILL",
    modelId: spec.modelId,
    reasoning: spec.reasoning,
    usage: normalizeUsage(result.totalUsage),
    gatewayCostUsd: readGatewayCost(result.providerMetadata),
  }];
  await persistUsageEntries({ conversationId: null, entries, messageId: null, mode });

  return {
    costUsd: summarizeUsage(entries).costUsd,
    model: formatModelWithReasoning(spec.modelId, spec.reasoning),
    period: getBillingPeriodKey(period),
    reviewed: rows.length,
    suggestions: validateReviewSuggestions(rows, result.output),
  };
};
