import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { sortMailMessages } from "@/lib/mail-agent/message-date";
import { resolveMailThread } from "@/lib/mail-agent/threading";

export type PersistedMailInput = {
  folderKey: string;
  uidValidity: string;
  providerUid: string;
  internetMessageId?: string | null;
  inReplyTo?: string | null;
  referenceIds: string[];
  direction: "INBOUND" | "OUTBOUND";
  fromAddress: string;
  fromName?: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
  messageAt: Date;
  isRead: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  requiresHandoff: boolean;
  autoSubmitted?: string | null;
  listId?: string | null;
  headers?: Prisma.InputJsonValue;
  attachments: Array<{
    filename: string;
    mimeType: string;
    sizeBytes: number;
    contentId?: string | null;
    providerPartId?: string | null;
  }>;
};

export const refreshMailThreadStats = async (threadId: string) => {
  const messages = await db.mailMessage.findMany({
    where: { threadId },
    select: {
      direction: true,
      receivedAt: true,
      sentAt: true,
      createdAt: true,
      isRead: true,
      isArchived: true,
    },
  });
  const latest = sortMailMessages(messages, "desc")[0];
  if (!latest) return;
  const latestInbound = sortMailMessages(
    messages.filter(({ direction }) => direction === "INBOUND"),
    "desc"
  )[0];
  const unreadCount = messages.filter(
    (message) =>
      message.direction === "INBOUND" && !message.isRead && !message.isArchived
  ).length;
  await db.mailThread.update({
    where: { id: threadId },
    data: {
      unreadCount,
      lastMessageAt: latest.receivedAt ?? latest.sentAt ?? latest.createdAt,
      lastInboundAt:
        latestInbound?.receivedAt ?? latestInbound?.sentAt ?? latestInbound?.createdAt ?? null,
    },
  });
};

export const persistSyncedMail = async (input: PersistedMailInput) => {
  const duplicate = input.internetMessageId
    ? await db.mailMessage.findFirst({
        where: { internetMessageId: input.internetMessageId },
        select: { id: true, threadId: true, folderKey: true },
      })
    : null;
  if (duplicate) {
    const keepInboxCopy = duplicate.folderKey === "INBOX" && input.folderKey !== "INBOX";
    if (!keepInboxCopy) {
      await db.mailMessage.update({
        where: { id: duplicate.id },
        data: {
          folderKey: input.folderKey,
          uidValidity: input.uidValidity,
          providerUid: input.providerUid,
          direction: input.direction,
          state: input.direction === "INBOUND" ? "RECEIVED" : "SENT",
          receivedAt: input.direction === "INBOUND" ? input.messageAt : null,
          sentAt: input.direction === "OUTBOUND" ? input.messageAt : null,
          isRead: input.isRead,
          isArchived: input.isArchived,
        },
      });
    }
    await refreshMailThreadStats(duplicate.threadId);
    return { id: duplicate.id, threadId: duplicate.threadId, created: false };
  }

  const result = await db.$transaction(async (tx) => {
    const { attachments, messageAt, ...messageData } = input;
    const thread = await resolveMailThread(tx, {
      subject: input.subject,
      participants: [input.fromAddress, ...input.toAddresses, ...input.ccAddresses],
      inReplyTo: input.inReplyTo,
      references: input.referenceIds,
      messageAt: input.messageAt,
      inbound: input.direction === "INBOUND",
      rootIdentity:
        input.internetMessageId ??
        `${input.folderKey}:${input.uidValidity}:${input.providerUid}`,
    });
    const message = await tx.mailMessage.create({
      data: {
        ...messageData,
        state: input.direction === "INBOUND" ? "RECEIVED" : "SENT",
        threadId: thread.id,
        receivedAt: input.direction === "INBOUND" ? messageAt : null,
        sentAt: input.direction === "OUTBOUND" ? messageAt : null,
        attachments: { create: attachments },
      },
      select: { id: true, threadId: true },
    });
    return { ...message, created: true };
  });
  await refreshMailThreadStats(result.threadId);
  return result;
};

export const cancelQueuedThreadReplies = async (threadId: string) => {
  const inbound = await db.mailMessage.findMany({
    where: { threadId, direction: "INBOUND" },
    select: { id: true },
  });
  if (!inbound.length) return 0;
  const result = await db.mailAutoReplyQueue.updateMany({
    where: {
      inboundMessageId: { in: inbound.map(({ id }) => id) },
      status: "QUEUED",
    },
    data: { status: "CANCELLED", cancelReason: "new_follow_up" },
  });
  return result.count;
};
