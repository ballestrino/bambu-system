import "server-only";

import { getBillerInvoicePdf } from "@/lib/billing/biller-server";
import { buildInvoiceEmailHtml, INVOICE_MAIL_ADDRESS, INVOICE_MAIL_FROM } from "@/lib/billing/invoice-delivery";
import { getResend } from "@/lib/mail";

// Manda una factura emitida por correo con su PDF (feature 53), por Resend y
// desde facturacion@ (alias de contacto@: las respuestas llegan a esa casilla).
// Lo llama solo la acción sendInvoiceEmail; el agente no llega acá.
export class InvoiceMailError extends Error {}

export const sendInvoiceMail = async (input: {
  billerId: number;
  filename: string;
  message: string;
  requestId: string;
  subject: string;
  to: string[];
}) => {
  const pdf = await getBillerInvoicePdf(input.billerId);
  let response: Awaited<ReturnType<ReturnType<typeof getResend>["emails"]["send"]>>;
  try {
    response = await getResend().emails.send(
      {
        from: INVOICE_MAIL_FROM,
        replyTo: INVOICE_MAIL_ADDRESS,
        to: input.to,
        subject: input.subject,
        text: input.message,
        html: buildInvoiceEmailHtml(input.message),
        attachments: [{ content: pdf, contentType: "application/pdf", filename: input.filename }],
      },
      // Mismo pedido, mismo correo: Resend no lo manda dos veces (24 h).
      { idempotencyKey: `invoice-send/${input.requestId}` }
    );
  } catch (error) {
    throw new InvoiceMailError(error instanceof Error ? error.message : "Resend no respondió");
  }
  // Resend no tira: devuelve { error }.
  if (response.error || !response.data) throw new InvoiceMailError(response.error?.message ?? "Resend no confirmó el envío");
  return { messageId: response.data.id };
};
