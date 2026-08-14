import type { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

import { buildThreadParticipants, normalizeMailSubject } from "@/lib/mail-agent/normalize";

type ThreadInput = {
  subject: string;
  participants: string[];
  inReplyTo?: string | null;
  references?: string[];
  messageAt: Date;
  inbound: boolean;
  rootIdentity?: string;
};

export const buildMailThreadKey = (
  subject: string,
  participants: string[],
  rootIdentity?: string
) =>
  createHash("sha256")
    .update(
      [
        normalizeMailSubject(subject),
        buildThreadParticipants(participants).join(","),
        rootIdentity ?? "legacy",
      ].join("\n")
    )
    .digest("hex");

export const resolveMailThread = async (
  tx: Prisma.TransactionClient,
  input: ThreadInput
) => {
  const referenceIds = [input.inReplyTo, ...(input.references ?? [])].filter(
    (value): value is string => Boolean(value)
  );
  if (referenceIds.length) {
    const parent = await tx.mailMessage.findFirst({
      where: { internetMessageId: { in: referenceIds } },
      select: { thread: true },
    });
    if (parent) return parent.thread;
  }

  const participantEmails = buildThreadParticipants(input.participants);
  const threadKey = buildMailThreadKey(
    input.subject,
    participantEmails,
    referenceIds.length ? undefined : input.rootIdentity
  );
  return tx.mailThread.upsert({
    where: { threadKey },
    create: {
      threadKey,
      subject: input.subject || "(Sin asunto)",
      normalizedSubject: normalizeMailSubject(input.subject),
      participantEmails,
      lastMessageAt: input.messageAt,
      lastInboundAt: input.inbound ? input.messageAt : null,
    },
    update: {
      participantEmails,
      lastMessageAt: input.messageAt,
      ...(input.inbound ? { lastInboundAt: input.messageAt } : {}),
    },
  });
};
