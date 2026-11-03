import type { InvoiceDeliveryChannel, PrismaClient } from "@prisma/client";

import { canSendInvoice, getDeliveryKey, normalizeDeliveryRecipient } from "@/lib/billing/invoice-delivery";

// Escribe el registro de envíos de una factura (feature 53). Cada cambio se
// audita en la misma transacción. El agente no llega acá (check:billing).

const invoiceSelect = { billerId: true, cfeType: true, number: true, series: true, status: true } as const;

// Lo que mandó Bambú: una fila por correo. Repetir el mismo pedido (mismo
// requestId) no duplica filas ni vuelve a auditar.
export const recordSystemDeliveries = (
  db: PrismaClient,
  input: { invoiceId: string; messageId: string | null; recipients: string[]; requestId: string; subject: string },
  actorId: string
) =>
  db.$transaction(async (tx) => {
    const sentAt = new Date();
    const { count } = await tx.invoiceDelivery.createMany({
      data: input.recipients.map((recipient) => ({
        channel: "EMAIL" as const,
        createdById: actorId,
        invoiceId: input.invoiceId,
        messageId: input.messageId,
        recipient,
        requestId: input.requestId,
        sentAt,
        source: "SYSTEM" as const,
      })),
      skipDuplicates: true,
    });
    if (count) {
      await tx.agentAuditEvent.create({
        data: {
          actorId,
          action: "invoice.send",
          entityType: "Invoice",
          entityId: input.invoiceId,
          metadata: { messageId: input.messageId, recipients: input.recipients, requestId: input.requestId, subject: input.subject },
        },
      });
    }
    return { count };
  });

// Los correos que ya salieron con este pedido (un reintento no reenvía).
export const findSentRequest = (db: PrismaClient, requestId: string) =>
  db.invoiceDelivery.findMany({ where: { requestId, source: "SYSTEM" }, select: { invoiceId: true, recipient: true } });

export type ManualDeliveryError = "duplicate" | "invalid" | "not_found" | "not_sendable";

// Anotar a mano: un correo o un WhatsApp mandado por fuera de Bambú.
export const addManualDelivery = (
  db: PrismaClient,
  input: { channel: InvoiceDeliveryChannel; invoiceId: string; recipient: string },
  actorId: string
) =>
  db.$transaction(async (tx): Promise<{ error: ManualDeliveryError; message?: string } | { id: string; recipient: string }> => {
    const normalized = normalizeDeliveryRecipient(input.channel, input.recipient);
    if (!normalized.ok) return { error: "invalid", message: normalized.error };

    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { ...invoiceSelect, deliveries: { where: { channel: input.channel }, select: { recipient: true } } },
    });
    if (!invoice) return { error: "not_found" };
    if (!canSendInvoice(invoice)) return { error: "not_sendable" };
    const key = getDeliveryKey(input.channel, normalized.recipient);
    if (invoice.deliveries.some((row) => getDeliveryKey(input.channel, row.recipient) === key)) return { error: "duplicate" };

    const created = await tx.invoiceDelivery.create({
      data: { channel: input.channel, createdById: actorId, invoiceId: input.invoiceId, recipient: normalized.recipient, source: "MANUAL" },
      select: { id: true, recipient: true },
    });
    await tx.agentAuditEvent.create({
      data: {
        actorId,
        action: "invoice.delivery.add",
        entityType: "Invoice",
        entityId: input.invoiceId,
        metadata: { channel: input.channel, deliveryId: created.id, number: invoice.number, recipient: created.recipient, series: invoice.series },
      },
    });
    return created;
  });

export type RemoveDeliveryError = "not_found" | "system";

// Quitar una anotación manual. Lo que mandó Bambú queda: es la constancia.
export const removeManualDelivery = (db: PrismaClient, input: { deliveryId: string }, actorId: string) =>
  db.$transaction(async (tx): Promise<{ error: RemoveDeliveryError } | { ok: true; recipient: string }> => {
    const delivery = await tx.invoiceDelivery.findUnique({
      where: { id: input.deliveryId },
      select: { channel: true, invoiceId: true, recipient: true, source: true },
    });
    if (!delivery) return { error: "not_found" };
    if (delivery.source !== "MANUAL") return { error: "system" };

    const { count } = await tx.invoiceDelivery.deleteMany({ where: { id: input.deliveryId, source: "MANUAL" } });
    if (!count) return { error: "not_found" };
    await tx.agentAuditEvent.create({
      data: {
        actorId,
        action: "invoice.delivery.remove",
        entityType: "Invoice",
        entityId: delivery.invoiceId,
        metadata: { channel: delivery.channel, deliveryId: input.deliveryId, recipient: delivery.recipient },
      },
    });
    return { ok: true, recipient: delivery.recipient };
  });
