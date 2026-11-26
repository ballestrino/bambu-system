import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { resolveSmtpAccount, WEB_FORMS_SENDER_NAME } from "@/lib/mailbox/smtp-account";
import { sendSmtpMail } from "@/lib/mailbox/smtp-send";
import { buildReplyHtml, buildReplyText } from "@/lib/web-forms/reply-text";

type ReplyInput = { id: string; requestId: string; subject: string; body: string; quoteOriginal: boolean };

export type ReplyOutcome = { success: string; savedToSent?: boolean } | { error: string };

const SMTP_ERRORS: Record<string, string> = {
  EAUTH: "Hostinger rechazó el usuario o la clave de contacto@",
  ECONNECTION: "No se pudo conectar con el servidor de correo",
  ETIMEDOUT: "El servidor de correo no respondió a tiempo",
  ESOCKET: "Se cortó la conexión con el servidor de correo",
  EENVELOPE: "El servidor de correo no aceptó la dirección del destinatario",
};

const describeSmtpError = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  return (code && SMTP_ERRORS[code]) || "No se pudo mandar el correo";
};

const alreadyRequested = (reply: { sentAt: Date | null }): ReplyOutcome =>
  reply.sentAt
    ? { success: "La respuesta ya se había mandado" }
    : { error: "Esa respuesta se está mandando. Esperá un momento y refrescá." };

// Responde un formulario web por correo desde contacto@. Primero reserva el
// pedido (requestId único), después manda; si el SMTP falla, borra la reserva
// para poder reintentar. Al salir, el formulario queda como respondido.
export const sendWebFormReply = async (input: ReplyInput, actorId: string): Promise<ReplyOutcome> => {
  const smtp = resolveSmtpAccount();
  if (!smtp.ok) return { error: `Falta configurar el correo: ${smtp.missing.join(", ")}` };

  const previous = await db.webFormReply.findUnique({ where: { requestId: input.requestId }, select: { sentAt: true } });
  if (previous) return alreadyRequested(previous);

  const submission = await db.webFormSubmission.findUnique({
    where: { id: input.id },
    select: { name: true, email: true, message: true, createdAt: true },
  });
  if (!submission) return { error: "Ese formulario ya no existe" };

  let replyId: string;
  try {
    const reserved = await db.webFormReply.create({
      data: {
        submissionId: input.id,
        requestId: input.requestId,
        fromAddress: smtp.account.fromAddress,
        toAddress: submission.email,
        subject: input.subject,
        body: input.body,
        sentById: actorId,
      },
      select: { id: true },
    });
    replyId = reserved.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Esa respuesta se está mandando. Esperá un momento y refrescá." };
    }
    throw error;
  }

  const quote = input.quoteOriginal
    ? { name: submission.name, sentAt: submission.createdAt, message: submission.message }
    : null;

  let sent;
  try {
    sent = await sendSmtpMail(smtp.account, {
      fromName: WEB_FORMS_SENDER_NAME,
      to: submission.email,
      subject: input.subject,
      text: buildReplyText(input.body, quote),
      html: buildReplyHtml(input.body, quote),
    });
  } catch (error) {
    console.error("Error al responder un formulario web:", error);
    await db.webFormReply.delete({ where: { id: replyId } }).catch(() => undefined);
    return { error: describeSmtpError(error) };
  }

  const now = new Date();
  await db.$transaction([
    db.webFormReply.update({
      where: { id: replyId },
      data: { sentAt: now, messageId: sent.messageId, savedToSent: sent.savedToSent },
    }),
    db.webFormSubmission.update({
      where: { id: input.id },
      data: { status: "REPLIED", handledById: actorId, handledAt: now },
    }),
  ]);

  return sent.savedToSent
    ? { success: `Respuesta enviada a ${submission.email}`, savedToSent: true }
    : { success: `Respuesta enviada a ${submission.email} (no quedó copia en Enviados)`, savedToSent: false };
};
