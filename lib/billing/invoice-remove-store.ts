import type { PrismaClient } from "@prisma/client";

import { getBillingPeriodKey } from "@/lib/billing/billing-month";
import { lockBillingPeriod } from "@/lib/billing/draft-store";
import { getReceiverName, readStoredReceiver } from "@/lib/billing/invoice-json";
import {
  ARCHIVABLE_STATUSES,
  canArchiveInvoice,
  getDeleteDraftError,
  type ArchiveError,
  type DeleteDraftError,
} from "@/lib/billing/invoice-remove";
import { lockBatch } from "@/lib/billing/issue-claim";

export type DeleteDraftResult = { batchUpdatedAt: Date; ok: true } | { error: DeleteDraftError };

const invoiceSelect = {
  batch: { select: { id: true, period: true, status: true } },
  cfeType: true, currency: true, internalNumber: true, receiver: true, sourceInvoiceId: true, status: true, total: true,
  updatedAt: true,
} as const;

// Borrar una factura del borrador (feature 47): solo DRAFT en un lote DRAFT.
// Con el lock del mes y el del lote (el mismo que toma "Emitir N") y
// compare-and-set sobre su updatedAt. Mueve el updatedAt del lote, así un
// diálogo de "Emitir" abierto antes recibe "El borrador cambió". La
// auditoría va en la misma transacción.
export const deleteDraftInvoice = (
  db: PrismaClient,
  input: { invoiceId: string; updatedAt: string },
  actorId: string
) =>
  db.$transaction<DeleteDraftResult>(async (tx) => {
    const seen = await tx.invoice.findUnique({ where: { id: input.invoiceId }, select: { batch: { select: { id: true, period: true } } } });
    if (seen?.batch) {
      await lockBillingPeriod(tx, seen.batch.period);
      await lockBatch(tx, seen.batch.id);
    }

    // Se relee con los locks tomados: lo que vale es el estado de ahora.
    const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId }, select: invoiceSelect });
    const blocked = getDeleteDraftError(invoice ? { batchStatus: invoice.batch?.status ?? null, status: invoice.status } : null);
    if (blocked) return { error: blocked };
    if (!invoice?.batch || invoice.updatedAt.toISOString() !== input.updatedAt) return { error: "stale" };

    const { count } = await tx.invoice.deleteMany({
      where: { id: input.invoiceId, status: "DRAFT", updatedAt: invoice.updatedAt },
    });
    if (!count) return { error: "stale" };

    const batchUpdatedAt = new Date();
    await tx.invoiceBatch.update({ where: { id: invoice.batch.id }, data: { updatedAt: batchUpdatedAt } });
    await tx.agentAuditEvent.create({
      data: {
        actorId,
        action: "invoice.delete",
        entityType: "Invoice",
        entityId: input.invoiceId,
        metadata: {
          batchId: invoice.batch.id,
          cfeType: invoice.cfeType,
          currency: invoice.currency,
          internalNumber: invoice.internalNumber,
          period: getBillingPeriodKey(invoice.batch.period),
          receiver: getReceiverName(readStoredReceiver(invoice.receiver)),
          sourceInvoiceId: invoice.sourceInvoiceId,
          total: invoice.total.toString(),
        },
      },
    });
    return { batchUpdatedAt, ok: true };
  });

export type ArchiveResult = { archived: boolean; changed: boolean; ok: true } | { error: ArchiveError };

// Archivar o desarchivar una emitida (también una rechazada). Solo la saca de
// las listas: sigue en Biller y en el resumen, y la sincronización no toca
// archivedAt. Repetirlo no cambia nada ni vuelve a auditar.
export const setInvoiceArchived = (
  db: PrismaClient,
  input: { archived: boolean; invoiceId: string },
  actorId: string
) =>
  db.$transaction<ArchiveResult>(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { archivedAt: true, billerId: true, cfeType: true, number: true, series: true, status: true },
    });
    if (!invoice) return { error: "not_found" };
    if (!canArchiveInvoice(invoice.status)) return { error: "not_archivable" };

    const { count } = await tx.invoice.updateMany({
      where: {
        id: input.invoiceId,
        status: { in: [...ARCHIVABLE_STATUSES] },
        archivedAt: input.archived ? null : { not: null },
      },
      data: input.archived ? { archivedAt: new Date(), archivedById: actorId } : { archivedAt: null, archivedById: null },
    });
    if (!count) return { archived: input.archived, changed: false, ok: true };

    await tx.agentAuditEvent.create({
      data: {
        actorId,
        action: input.archived ? "invoice.archive" : "invoice.unarchive",
        entityType: "Invoice",
        entityId: input.invoiceId,
        metadata: { billerId: invoice.billerId, cfeType: invoice.cfeType, number: invoice.number, series: invoice.series, status: invoice.status },
      },
    });
    return { archived: input.archived, changed: true, ok: true };
  });
