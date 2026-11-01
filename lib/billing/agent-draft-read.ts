import type { PrismaClient } from "@prisma/client";

import { getBillingPeriodKey } from "@/lib/billing/billing-month";
import { readStoredItems } from "@/lib/billing/invoice-json";
import { getItemsSubtotal } from "@/lib/billing/invoice-totals";

const round = (amount: number) => Math.round(amount * 100) / 100;

// Lo que dice la tarjeta del borrador en el chat: cuántas facturas van a
// salir y por cuánto, como la barra de "Emitir N" de la página.
export const readDraftCardSummary = async (db: PrismaClient, batchId: string) => {
  const batch = await db.invoiceBatch.findUniqueOrThrow({
    where: { id: batchId },
    select: {
      id: true, origin: true, period: true, status: true, updatedAt: true,
      invoices: { select: { items: true, selected: true, status: true, total: true } },
    },
  });
  const pending = batch.invoices.filter((invoice) => invoice.status === "DRAFT");
  const marked = pending.filter((invoice) => invoice.selected);
  return {
    batchId: batch.id,
    count: marked.length,
    issued: batch.invoices.length - pending.length,
    origin: batch.origin,
    period: getBillingPeriodKey(batch.period),
    rows: batch.invoices.length,
    status: batch.status,
    subtotal: round(marked.reduce((sum, invoice) => sum + getItemsSubtotal(readStoredItems(invoice.items) ?? []), 0)),
    total: round(marked.reduce((sum, invoice) => sum + Number(invoice.total), 0)),
    unmarked: pending.length - marked.length,
    updatedAt: batch.updatedAt.toISOString(),
  };
};
