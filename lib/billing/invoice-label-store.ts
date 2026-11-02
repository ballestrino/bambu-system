import type { Prisma, PrismaClient } from "@prisma/client";

import { getReceiverName, isConsumerReceiver, readStoredReceiver } from "@/lib/billing/invoice-json";
import { cleanInvoiceLabel } from "@/lib/billing/invoice-label";
import { getReceiverKey } from "@/lib/billing/receiver-job";

type Db = PrismaClient;

export type InvoiceLabelResult =
  | { label: string | null; movedJob: boolean; ok: true; updatedAt: Date }
  | { error: "not_consumer" | "not_found" | "stale" };

// Pone, cambia o quita el título interno de una factura a consumidor final
// (51), con compare-and-set sobre su updatedAt. Si el título viejo tenía un
// trabajo y el nuevo no, el vínculo pasa al nuevo: renombrar no lo pierde.
// No toca Biller, así que vale también para lo ya emitido.
export const saveInvoiceLabel = (
  db: Db,
  input: { invoiceId: string; label: string | null; updatedAt: Date },
  userId: string
): Promise<InvoiceLabelResult> =>
  db.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { label: true, receiver: true, updatedAt: true },
    });
    if (!invoice) return { error: "not_found" as const };
    if (invoice.updatedAt.getTime() !== input.updatedAt.getTime()) return { error: "stale" as const };
    const receiver = readStoredReceiver(invoice.receiver);
    if (!isConsumerReceiver(receiver)) return { error: "not_consumer" as const };

    const label = cleanInvoiceLabel(input.label);
    const updated = await tx.invoice.update({ where: { id: input.invoiceId }, data: { label }, select: { updatedAt: true } });

    const oldKey = getReceiverKey(receiver, invoice.label);
    const newKey = getReceiverKey(receiver, label);
    let movedJob = false;
    if (oldKey && newKey && oldKey !== newKey) {
      const [oldLink, newLink] = await Promise.all([
        tx.billingReceiverJob.findUnique({ where: { receiverKey: oldKey }, select: { id: true } }),
        tx.billingReceiverJob.findUnique({ where: { receiverKey: newKey }, select: { id: true } }),
      ]);
      if (oldLink && !newLink) {
        await tx.billingReceiverJob.update({
          where: { id: oldLink.id },
          data: { createdById: userId, receiverKey: newKey, receiverName: getReceiverName(receiver, label) },
        });
        movedJob = true;
      }
    }
    return { label, movedJob, ok: true as const, updatedAt: updated.updatedAt };
  });
