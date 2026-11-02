import { Prisma, type PrismaClient } from "@prisma/client";

import { applyDraftLineEdits } from "@/lib/billing/draft-edit";
import { describeItemChanges } from "@/lib/billing/draft-editor";
import { readStoredItems } from "@/lib/billing/invoice-json";
import { getItemsTotal } from "@/lib/billing/invoice-totals";
import type { DraftInvoiceEdit } from "@/schemas/billing";

export type DraftUpdateResult =
  | { ok: true; updatedAt: Date }
  | { error: "not_found" | "not_editable" | "stale" | "invalid_lines" };

// Cambia una factura del borrador solo si sigue como la vio la página
// (compare-and-set sobre updatedAt) y el borrador todavía no se emite. Toca
// también el updatedAt del borrador, que es lo que compara emitir (regla 2).
// Un cambio de detalle o precio queda auditado (el editor lateral muestra
// quién lo cambió); marcar o desmarcar no.
export const updateDraftInvoice = (db: PrismaClient, edit: DraftInvoiceEdit, actorId: string | null = null) =>
  db.$transaction<DraftUpdateResult>(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: edit.invoiceId },
      select: { adenda: true, batch: { select: { id: true, status: true } }, currency: true, items: true, status: true, updatedAt: true },
    });
    if (!invoice) return { error: "not_found" };
    if (invoice.status !== "DRAFT" || !invoice.batch || invoice.batch.status !== "DRAFT") {
      return { error: "not_editable" };
    }
    if (invoice.updatedAt.toISOString() !== edit.updatedAt) return { error: "stale" };

    let itemsUpdate: Pick<Prisma.InvoiceUpdateManyMutationInput, "items" | "total"> = {};
    let changes: string[] = [];
    if (edit.lines?.length) {
      const before = readStoredItems(invoice.items) ?? [];
      const items = applyDraftLineEdits(before, edit.lines);
      if (!items) return { error: "invalid_lines" };
      itemsUpdate = { items: items as Prisma.InputJsonValue, total: getItemsTotal(items) };
      changes = describeItemChanges(before, items, invoice.currency);
    }
    const adenda = edit.adenda === undefined ? undefined : edit.adenda?.trim() || null;
    if (adenda !== undefined && adenda !== invoice.adenda) changes.push(adenda ? "Adenda cambiada" : "Sin adenda");

    const updatedAt = new Date();
    const { count } = await tx.invoice.updateMany({
      where: { id: edit.invoiceId, status: "DRAFT", updatedAt: invoice.updatedAt },
      data: {
        ...itemsUpdate,
        ...(edit.selected !== undefined ? { selected: edit.selected } : {}),
        ...(adenda !== undefined ? { adenda } : {}),
        updatedAt,
      },
    });
    if (!count) return { error: "stale" };

    await tx.invoiceBatch.update({ where: { id: invoice.batch.id }, data: { updatedAt } });
    if (changes.length) {
      await tx.agentAuditEvent.create({
        data: {
          actorId,
          action: "invoice.edit",
          entityType: "Invoice",
          entityId: edit.invoiceId,
          metadata: { batchId: invoice.batch.id, changes, source: "person", via: "row" },
        },
      });
    }
    return { ok: true, updatedAt };
  });
