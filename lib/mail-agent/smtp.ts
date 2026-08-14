import { randomUUID } from "node:crypto";

import MailComposer from "nodemailer/lib/mail-composer";
import nodemailer from "nodemailer";

import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import {
  getMailRuntimeConfig,
  MAIL_ATTACHMENT_LIMIT_BYTES,
} from "@/lib/mail-agent/config";
import {
  createMailImapClient,
  resolveSyncFolders,
} from "@/lib/mail-agent/imap-client";
import { resolveMailThread } from "@/lib/mail-agent/threading";

export type OutboundAttachment = {
  filename: string;
  contentType: string;
  content: Buffer;
};

export type SendMailInput = {
  threadId?: string;
  inReplyToId?: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  attachments?: OutboundAttachment[];
  suggestionId?: string;
};

const appendToSent = async (raw: Buffer) => {
  const client = createMailImapClient();
  try {
    await client.connect();
    const sentPath =
      resolveSyncFolders(await client.list()).find(({ key }) => key === "SENT")?.path ||
      getMailRuntimeConfig().sentFolder;
    await client.append(sentPath, raw, ["\\Seen"], new Date());
  } finally {
    await client.logout().catch(() => undefined);
  }
};

export const sendSharedMail = async (input: SendMailInput, actorId?: string) => {
  const config = getMailRuntimeConfig();
  const attachments = input.attachments ?? [];
  const attachmentBytes = attachments.reduce((sum, item) => sum + item.content.length, 0);
  if (attachmentBytes > MAIL_ATTACHMENT_LIMIT_BYTES) {
    throw new Error("Los adjuntos superan el límite total de 4 MB");
  }
  const parent = input.inReplyToId
    ? await db.mailMessage.findUnique({ where: { id: input.inReplyToId } })
    : null;
  const messageId = `<${randomUUID()}@${config.from.split("@")[1] || "bambu.local"}>`;
  const references = parent
    ? [...parent.referenceIds, parent.internetMessageId].filter((item): item is string => Boolean(item))
    : [];
  const localUid = `local:${randomUUID()}`;
  const queued = await db.$transaction(async (tx) => {
    const thread = input.threadId
      ? await tx.mailThread.findUniqueOrThrow({ where: { id: input.threadId } })
      : await resolveMailThread(tx, {
          subject: input.subject,
          participants: [config.from, ...input.to, ...(input.cc ?? [])],
          messageAt: new Date(),
          inbound: false,
          rootIdentity: messageId,
        });
    return tx.mailMessage.create({
      data: {
        threadId: thread.id,
        folderKey: "SENT",
        uidValidity: "local",
        providerUid: localUid,
        internetMessageId: messageId,
        inReplyTo: parent?.internetMessageId,
        referenceIds: references,
        direction: "OUTBOUND",
        state: "QUEUED",
        fromAddress: config.from.toLowerCase(),
        toAddresses: input.to.map((address) => address.toLowerCase()),
        ccAddresses: (input.cc ?? []).map((address) => address.toLowerCase()),
        bccAddresses: [],
        subject: input.subject,
        bodyText: input.body,
        isRead: true,
        hasAttachments: attachments.length > 0,
        attachments: {
          create: attachments.map((item) => ({
            filename: item.filename,
            mimeType: item.contentType,
            sizeBytes: item.content.length,
          })),
        },
      },
      select: { id: true, threadId: true },
    });
  });
  const mailOptions = {
    from: config.from,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    text: input.body,
    messageId,
    inReplyTo: parent?.internetMessageId ?? undefined,
    references,
    attachments: attachments.map((item) => ({
      filename: item.filename,
      contentType: item.contentType,
      content: item.content,
    })),
  };
  try {
    const raw = await new MailComposer(mailOptions).compile().build();
    const transport = nodemailer.createTransport({
      ...config.smtp,
      auth: config.auth,
    });
    await transport.sendMail(mailOptions);
    let appendError: string | null = null;
    try {
      await appendToSent(raw);
    } catch (error) {
      appendError = error instanceof Error ? error.message : "Error al copiar a Sent";
    }
    await db.$transaction([
      db.mailMessage.update({
        where: { id: queued.id },
        data: { state: "SENT", sentAt: new Date() },
      }),
      db.mailThread.update({
        where: { id: queued.threadId },
        data: { lastMessageAt: new Date() },
      }),
      ...(input.suggestionId
        ? [
            db.mailSuggestion.update({
              where: { id: input.suggestionId },
              data: { status: "SENT", reviewedById: actorId, reviewedAt: new Date() },
            }),
          ]
        : []),
    ]);
    await recordMailAudit({
      actorId,
      action: appendError ? "send.sent_append_failed" : "send.sent",
      entityType: "MailMessage",
      entityId: queued.id,
      metadata: { appendError, attachmentBytes },
    });
    return queued;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de envío";
    await db.mailMessage.update({ where: { id: queued.id }, data: { state: "FAILED" } });
    await recordMailAudit({
      actorId,
      action: "send.failed",
      entityType: "MailMessage",
      entityId: queued.id,
      metadata: { error: message },
    });
    throw error;
  }
};
