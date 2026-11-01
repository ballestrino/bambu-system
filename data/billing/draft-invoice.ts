import "server-only";

import { addBillingMonths, getBillingPeriodKey } from "@/lib/billing/billing-month";
import { getBillingMonthName } from "@/lib/billing/billing-month-text";
import { describeSourceChanges } from "@/lib/billing/draft-editor-diff";
import { loadDraftEditorRow, toEditorState } from "@/lib/billing/draft-editor-store";
import { getReceiverName } from "@/lib/billing/invoice-json";
import { getItemsSubtotal } from "@/lib/billing/invoice-totals";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

const HISTORY_LIMIT = 5;

const readChanges = (metadata: unknown) => {
  const value = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  return {
    by: value.source === "agent" ? ("agent" as const) : ("person" as const),
    changes: Array.isArray(value.changes) ? value.changes.filter((item): item is string => typeof item === "string") : [],
  };
};

// Una factura del borrador en el editor lateral (feature 49): el formulario
// con las fechas que saldrían, lo que cambió contra la factura del mes pasado
// y quién la cambió (el agente o una persona, de la auditoría).
export const getDraftInvoiceEditor = async (invoiceId: string) => {
  await requireAdminSession();
  const today = getIssueDay(new Date());
  const row = await loadDraftEditorRow(db, invoiceId);
  if (!row?.batch) return { error: "La factura ya no está en el borrador" };

  const state = toEditorState(row, row.batch.period, today);
  const events = await db.agentAuditEvent.findMany({
    where: { action: "invoice.edit", entityId: row.id, entityType: "Invoice" },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { actor: { select: { email: true, name: true } }, createdAt: true, id: true, metadata: true },
  });
  const from = addBillingMonths(row.batch.period, -1);

  return {
    block: state.block,
    issueError: row.error,
    form: state.form,
    history: events.map((event) => ({
      ...readChanges(event.metadata),
      actor: event.actor?.name || event.actor?.email || null,
      at: event.createdAt.toISOString(),
      id: event.id,
    })),
    id: row.id,
    name: getReceiverName(state.invoice.receiver),
    period: getBillingPeriodKey(row.batch.period),
    selected: row.selected,
    // Contra la factura del mes pasado que repite (null: es nueva).
    source: state.source
      ? {
          changes: describeSourceChanges(state.invoice, state.source, { from, to: row.batch.period }),
          month: `${getBillingMonthName(from)} ${from.getUTCFullYear()}`,
          subtotal: getItemsSubtotal(state.source.items ?? []),
        }
      : null,
    status: row.status,
    today: today.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString(),
  };
};

export type DraftInvoiceEditorView = Exclude<Awaited<ReturnType<typeof getDraftInvoiceEditor>>, { error: string }>;
