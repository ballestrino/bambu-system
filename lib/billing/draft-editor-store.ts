import { Prisma, type PrismaClient } from "@prisma/client";

import { getBillingPeriodKey } from "@/lib/billing/billing-month";
import { describeFormChanges, draftToForm, formToDraftData, getDraftEditorBlock, type DraftEditorInvoice } from "@/lib/billing/draft-editor";
import { getPaymentForm, PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import { lockBillingPeriod, toRepeatSource } from "@/lib/billing/draft-store";
import { pickExplicitDates, resolveDraftDates, toIsoDay } from "@/lib/billing/invoice-dates";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { lockBatch } from "@/lib/billing/issue-claim";
import { getNewInvoiceProblems } from "@/lib/billing/new-invoice";
import type { DraftInvoiceFormRequest } from "@/schemas/billing-new-invoice";

type Reader = Pick<Prisma.TransactionClient, "invoice">;

const sourceSelect = {
  adenda: true, billerId: true, cfeType: true, currency: true, dueDate: true, id: true, issueDate: true,
  items: true, paymentForm: true, receiver: true, receiverDocument: true, status: true, total: true,
} as const;

export const draftEditorSelect = {
  adenda: true, batch: { select: { id: true, period: true, status: true } }, cfeType: true, currency: true, dueDate: true,
  dueDays: true, error: true, id: true, issueDate: true, items: true, paymentForm: true, purchaseOrder: true, receiver: true,
  selected: true, sourceInvoice: { select: sourceSelect }, status: true, total: true, updatedAt: true,
} satisfies Prisma.InvoiceSelect;

export type DraftEditorRow = Prisma.InvoiceGetPayload<{ select: typeof draftEditorSelect }>;

export const loadDraftEditorRow = (db: Reader, invoiceId: string) =>
  db.invoice.findUnique({ where: { id: invoiceId }, select: draftEditorSelect });

// La fila como la ve el formulario: la forma de pago de la de origen si no
// guardó una (como toDraftRow) y las fechas elegidas o las de por defecto
// para `period`, el mes del borrador.
export const toEditorState = (row: DraftEditorRow, period: Date, today: Date) => {
  const source = row.sourceInvoice ? toRepeatSource(row.sourceInvoice) : null;
  const invoice: DraftEditorInvoice = {
    adenda: row.adenda,
    cfeType: row.cfeType,
    currency: row.currency,
    items: readStoredItems(row.items),
    paymentForm: row.paymentForm ?? (source ? getPaymentForm(source) : PAYMENT_FORM.CASH),
    purchaseOrder: row.purchaseOrder,
    receiver: readStoredReceiver(row.receiver),
  };
  const dates = resolveDraftDates({ explicitDue: row.dueDate, explicitIssue: row.issueDate, paymentForm: invoice.paymentForm, period, today });
  const form = draftToForm(invoice, { dueDate: dates.dueDate ? toIsoDay(dates.dueDate) : "", issueDate: toIsoDay(dates.issueDate) });
  return { block: getDraftEditorBlock({ ...row, batchStatus: row.batch?.status ?? null }), form, invoice, source };
};

export type DraftFormSaveResult =
  | { changes: string[]; ok: true; total: number; updatedAt: Date }
  | { error: "not_found" | "not_editable" | "stale" }
  | { error: "invalid"; message: string };

const json = (value: unknown) => (value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue));

// Guardar desde el editor lateral (49): con el lock del mes y el del lote
// (el de "Emitir N") y compare-and-set sobre el updatedAt de la factura.
// Mueve el updatedAt del lote, así un "Emitir" abierto en otra pestaña ve el
// cambio; la página toma el nuevo y el suyo no se rechaza. Se audita quién
// cambió qué (lo muestra el editor). Sin cambios no toca nada.
export const saveDraftInvoiceForm = (db: PrismaClient, request: DraftInvoiceFormRequest, actorId: string, today: Date) =>
  db.$transaction<DraftFormSaveResult>(async (tx) => {
    const seen = await tx.invoice.findUnique({ where: { id: request.invoiceId }, select: { batch: { select: { id: true, period: true } } } });
    if (seen?.batch) {
      await lockBillingPeriod(tx, seen.batch.period);
      await lockBatch(tx, seen.batch.id);
    }
    const row = await loadDraftEditorRow(tx, request.invoiceId);
    if (!row?.batch) return { error: "not_found" };
    const state = toEditorState(row, row.batch.period, today);
    if (state.block) return { error: "not_editable" };
    if (row.updatedAt.toISOString() !== request.updatedAt) return { error: "stale" };
    const problems = getNewInvoiceProblems(request.form, toIsoDay(today));
    if (problems.length) return { error: "invalid", message: problems[0] };

    const data = formToDraftData(state.invoice, state.form, request.form);
    const changes = describeFormChanges(state.form, request.form, { after: data.items, before: state.invoice.items ?? [] });
    if (!changes.length) return { changes, ok: true, total: Number(row.total), updatedAt: row.updatedAt };
    const dates = pickExplicitDates(request.form, { period: row.batch.period, today });

    const updatedAt = new Date();
    const { count } = await tx.invoice.updateMany({
      where: { id: row.id, status: "DRAFT", updatedAt: row.updatedAt },
      // dueDays (45) ya no cuenta: el vencimiento es el elegido o el del 10.
      data: { ...data, dueDate: dates.dueDate, dueDays: null, issueDate: dates.issueDate, items: json(data.items), receiver: json(data.receiver), updatedAt },
    });
    if (!count) return { error: "stale" };
    await tx.invoiceBatch.update({ where: { id: row.batch.id }, data: { updatedAt } });
    await tx.agentAuditEvent.create({
      data: {
        actorId,
        action: "invoice.edit",
        entityType: "Invoice",
        entityId: row.id,
        metadata: { batchId: row.batch.id, changes, period: getBillingPeriodKey(row.batch.period), source: "person", via: "editor" },
      },
    });
    return { changes, ok: true, total: data.total, updatedAt };
  });
