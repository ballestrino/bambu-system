import { Prisma, type PrismaClient } from "@prisma/client";

import { applyDraftLineEdits } from "@/lib/billing/draft-edit";
import { readStoredItems } from "@/lib/billing/invoice-json";
import { getItemsTotal } from "@/lib/billing/invoice-totals";
import type { DraftInvoiceEdit } from "@/schemas/billing";

export type DraftUpdateResult =
  | { ok: true; updatedAt: Date }
  | { error: "not_found" | "not_editable" | "stale" | "invalid_lines" };

// Cambia una factura del borrador solo si sigue como la vio la página
// (compare-and-set sobre updatedAt) y el borrador todavía no se emite. Toca
// también el updatedAt del borrador, que es lo que compara emitir (regla 2).
export const updateDraftInvoice = (db: PrismaClient, edit: DraftInvoiceEdit) =>
  db.$transaction<DraftUpdateResult>(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: edit.invoiceId },
      select: { batch: { select: { id: true, status: true } }, items: true, status: true, updatedAt: true },
    });
    if (!invoice) return { error: "not_found" };
    if (invoice.status !== "DRAFT" || !invoice.batch || invoice.batch.status !== "DRAFT") {
      return { error: "not_editable" };
    }
    if (invoice.updatedAt.toISOString() !== edit.updatedAt) return { error: "stale" };

    let itemsUpdate: Pick<Prisma.InvoiceUpdateManyMutationInput, "items" | "total"> = {};
    if (edit.lines?.length) {
      const items = applyDraftLineEdits(readStoredItems(invoice.items) ?? [], edit.lines);
      if (!items) return { error: "invalid_lines" };
      itemsUpdate = { items: items as Prisma.InputJsonValue, total: getItemsTotal(items) };
    }

    const updatedAt = new Date();
    const { count } = await tx.invoice.updateMany({
      where: { id: edit.invoiceId, status: "DRAFT", updatedAt: invoice.updatedAt },
      data: { ...itemsUpdate, ...(edit.selected !== undefined ? { selected: edit.selected } : {}), updatedAt },
    });
    if (!count) return { error: "stale" };

    await tx.invoiceBatch.update({ where: { id: invoice.batch.id }, data: { updatedAt } });
    return { ok: true, updatedAt };
  });
