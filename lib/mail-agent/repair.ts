import { db } from "@/lib/db";
import { refreshMailThreadStats } from "@/lib/mail-agent/persist-message";
import { resolveMailThread } from "@/lib/mail-agent/threading";

export const repairInboxMailDirections = async () => {
  const messages = await db.mailMessage.findMany({
    where: { folderKey: "INBOX", direction: "OUTBOUND" },
    select: { id: true, threadId: true, sentAt: true, createdAt: true },
  });
  if (!messages.length) return { updatedCount: 0, inboundIds: [] as string[] };
  await db.$transaction(
    messages.map((message) =>
      db.mailMessage.update({
        where: { id: message.id },
        data: {
          direction: "INBOUND",
          state: "RECEIVED",
          receivedAt: message.sentAt ?? message.createdAt,
          sentAt: null,
        },
      })
    )
  );
  const threadIds = [...new Set(messages.map(({ threadId }) => threadId))];
  await Promise.all(threadIds.map(refreshMailThreadStats));
  return { updatedCount: messages.length, inboundIds: messages.map(({ id }) => id) };
};

export const repairSelfAddressedInboxThreads = async (mailboxAddress: string) => {
  const messages = await db.mailMessage.findMany({
    where: { folderKey: "INBOX", direction: "INBOUND", fromAddress: mailboxAddress },
    select: {
      id: true,
      threadId: true,
      subject: true,
      fromAddress: true,
      toAddresses: true,
      ccAddresses: true,
      inReplyTo: true,
      referenceIds: true,
      internetMessageId: true,
      uidValidity: true,
      providerUid: true,
      receivedAt: true,
      createdAt: true,
      thread: { select: { _count: { select: { messages: true } } } },
    },
  });
  const candidates = messages.filter(
    (message) =>
      !message.inReplyTo &&
      !message.referenceIds.length &&
      message.toAddresses.includes(mailboxAddress) &&
      message.thread._count.messages > 1
  );
  const touchedThreads = new Set<string>();
  for (const message of candidates) {
    const thread = await db.$transaction(async (tx) => {
      const resolved = await resolveMailThread(tx, {
        subject: message.subject,
        participants: [message.fromAddress, ...message.toAddresses, ...message.ccAddresses],
        messageAt: message.receivedAt ?? message.createdAt,
        inbound: true,
        rootIdentity:
          message.internetMessageId ?? `${message.uidValidity}:${message.providerUid}`,
      });
      await tx.mailMessage.update({ where: { id: message.id }, data: { threadId: resolved.id } });
      return resolved;
    });
    touchedThreads.add(message.threadId);
    touchedThreads.add(thread.id);
  }
  await Promise.all([...touchedThreads].map(refreshMailThreadStats));
  return { updatedCount: candidates.length, inboundIds: candidates.map(({ id }) => id) };
};
