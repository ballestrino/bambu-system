import "server-only";

import { randomUUID } from "crypto";

import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";

import type { SmtpAccount } from "@/lib/mailbox/smtp-account";

// Manda un correo por el SMTP de Hostinger y deja la misma copia en Enviados
// por IMAP, así aparece en el buzón de contacto@ (y el agente la ve con
// listEmails). Si la copia falla, el correo ya salió: se avisa y no se repite.
const TIMEOUT_MS = 20_000;

export type OutgoingMail = {
  fromName: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

const buildRaw = async (account: SmtpAccount, mail: OutgoingMail, messageId: string) =>
  new MailComposer({
    from: { name: mail.fromName, address: account.fromAddress },
    to: mail.to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    messageId,
    date: new Date(),
  })
    .compile()
    .build();

const sentFolderPath = async (client: ImapFlow, fallback: string) => {
  const boxes = await client.list();
  return boxes.find((box) => box.specialUse === "\\Sent")?.path ?? boxes.find((box) => box.path === fallback)?.path ?? fallback;
};

const appendToSent = async (account: SmtpAccount, raw: Buffer) => {
  const { mailbox } = account;
  const client = new ImapFlow({
    ...mailbox.imap,
    auth: mailbox.auth,
    logger: false,
    emitLogs: false,
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  await client.connect();
  try {
    await client.append(await sentFolderPath(client, mailbox.sentFolder), raw, ["\\Seen"], new Date());
  } finally {
    await client.logout().catch(() => client.close());
  }
};

export type SendResult = { messageId: string; savedToSent: boolean };

export const sendSmtpMail = async (account: SmtpAccount, mail: OutgoingMail): Promise<SendResult> => {
  const domain = account.fromAddress.split("@")[1] ?? "bambu-servicios.com";
  const messageId = `<${randomUUID()}@${domain}>`;
  const raw = await buildRaw(account, mail, messageId);

  const transport = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: account.auth,
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  try {
    await transport.sendMail({ envelope: { from: account.fromAddress, to: [mail.to] }, raw });
  } finally {
    transport.close();
  }

  try {
    await appendToSent(account, raw);
    return { messageId, savedToSent: true };
  } catch (error) {
    console.error("El correo salió pero no se pudo guardar en Enviados:", error);
    return { messageId, savedToSent: false };
  }
};
