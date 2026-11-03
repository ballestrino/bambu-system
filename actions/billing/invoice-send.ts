"use server";

import { describeBillerError, BillerError } from "@/lib/billing/biller-errors";
import { canSendInvoice, getInvoicePdfName, normalizeEmailList } from "@/lib/billing/invoice-delivery";
import { findSentRequest, recordSystemDeliveries } from "@/lib/billing/invoice-delivery-store";
import { InvoiceMailError, sendInvoiceMail } from "@/lib/billing/invoice-mail";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { invoiceSendSchema } from "@/schemas/billing-delivery";

type SendResult = { error: string } | { recipients: string[]; success: string };

const sentMessage = (recipients: string[]) => `Factura enviada a ${recipients.join(", ")}`;

// Manda una factura emitida por correo, con el PDF de Biller adjunto, desde
// facturacion@ (feature 53). Solo una persona admin, desde la página: el
// agente no envía. Cada correo queda como una fila SYSTEM del registro.
export const sendInvoiceEmail = async (values: unknown): Promise<SendResult> => {
  try {
    const session = await requireAdminSession();
    const parsed = invoiceSendSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const list = normalizeEmailList(parsed.data.to);
    if ("error" in list) return list;

    // Un reintento del mismo pedido (doble clic, respuesta perdida) no reenvía.
    const already = await findSentRequest(db, parsed.data.requestId);
    if (already.length) {
      if (already.some((row) => row.invoiceId !== parsed.data.invoiceId)) return { error: "Pedido inválido" };
      const recipients = already.map((row) => row.recipient);
      return { recipients, success: sentMessage(recipients) };
    }

    const invoice = await db.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
      select: { billerId: true, cfeType: true, number: true, series: true, status: true },
    });
    if (!invoice) return { error: "La factura ya no existe" };
    if (!canSendInvoice(invoice) || invoice.billerId === null) return { error: "Solo se envía una factura emitida y no rechazada" };

    const { messageId } = await sendInvoiceMail({
      billerId: invoice.billerId,
      filename: getInvoicePdfName(invoice),
      message: parsed.data.message,
      requestId: parsed.data.requestId,
      subject: parsed.data.subject,
      to: list.emails,
    });
    await recordSystemDeliveries(
      db,
      { invoiceId: parsed.data.invoiceId, messageId, recipients: list.emails, requestId: parsed.data.requestId, subject: parsed.data.subject },
      session.user.id
    );
    return { recipients: list.emails, success: sentMessage(list.emails) };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    if (error instanceof BillerError) return { error: `No se pudo bajar el PDF de Biller: ${describeBillerError(error)}` };
    console.error("Error sending invoice email:", error);
    if (error instanceof InvoiceMailError) return { error: `No se pudo enviar el correo: ${error.message}` };
    if (error instanceof Error && /RESEND_API_KEY/.test(error.message)) return { error: error.message };
    return { error: "No se pudo enviar el correo" };
  }
};
