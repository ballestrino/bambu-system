import { db } from "@/lib/db";
import {
  getGroundedPriceMismatch,
  getOfficialSourceAmounts,
  hasUngroundedQuotedPrice,
} from "@/lib/mail-agent/price-grounding";
import { isMailSendWindowOpen } from "@/lib/mail-agent/schedule";
import { sendSharedMail } from "@/lib/mail-agent/smtp";

const cancel = (id: string, reason: string) =>
  db.mailAutoReplyQueue.update({
    where: { id },
    data: { status: "CANCELLED", cancelReason: reason, leaseUntil: null },
  });

export const processMailAutoReplyQueue = async () => {
  const now = new Date();
  const settings = await db.mailSettings.findUnique({ where: { id: "shared" } });
  if (!settings?.autoSendEnabled || !isMailSendWindowOpen(now)) {
    return { processed: 0, sent: 0 };
  }
  const candidates = await db.mailAutoReplyQueue.findMany({
    where: {
      status: "QUEUED",
      scheduledFor: { lte: now },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
    },
    orderBy: { scheduledFor: "asc" },
    take: 10,
    include: {
      rule: true,
      suggestion: {
        include: {
          message: true,
          revisions: {
            orderBy: { revision: "desc" },
            take: 1,
            include: { sources: { include: { officialBudgetOption: true } } },
          },
        },
      },
    },
  });
  let sent = 0;
  for (const item of candidates) {
    const claimed = await db.mailAutoReplyQueue.updateMany({
      where: { id: item.id, status: "QUEUED" },
      data: {
        status: "PROCESSING",
        leaseUntil: new Date(Date.now() + 10 * 60_000),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) continue;
    if (item.rule.status !== "ACTIVE") {
      await cancel(item.id, "rule_not_active");
      continue;
    }
    if (hasUngroundedQuotedPrice(
      `${item.suggestion.subject ?? ""}\n${item.suggestion.body ?? ""}`,
      item.suggestion.revisions[0]?.sources.length ?? 0
    )) {
      await cancel(item.id, "price_without_official_source");
      continue;
    }
    const officialAmounts = getOfficialSourceAmounts(item.suggestion.revisions[0]?.sources ?? []);
    if (officialAmounts.length && getGroundedPriceMismatch(
      `${item.suggestion.subject ?? ""}\n${item.suggestion.body ?? ""}`,
      officialAmounts
    ).mismatch) {
      await cancel(item.id, "price_mismatch_with_official_source");
      continue;
    }
    const inbound = item.suggestion.message;
    const latest = await db.mailMessage.findFirst({
      where: { threadId: inbound.threadId, direction: "INBOUND" },
      orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });
    if (latest?.id !== inbound.id) {
      await cancel(item.id, "new_follow_up");
      continue;
    }
    try {
      const outgoing = await sendSharedMail({
        threadId: inbound.threadId,
        inReplyToId: inbound.id,
        to: [inbound.fromAddress],
        subject: item.suggestion.subject || `Re: ${inbound.subject}`,
        body: item.suggestion.body || "",
        suggestionId: item.suggestion.id,
      });
      await db.mailAutoReplyQueue.update({
        where: { id: item.id },
        data: { status: "SENT", sentMessageId: outgoing.id, leaseUntil: null },
      });
      sent += 1;
    } catch (error) {
      await db.mailAutoReplyQueue.update({
        where: { id: item.id },
        data: {
          status: "FAILED",
          leaseUntil: null,
          lastError: error instanceof Error ? error.message : "Error de envío",
        },
      });
    }
  }
  return { processed: candidates.length, sent };
};
