import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { findSemanticMailRules } from "@/lib/mail-agent/embedding";
import { hashMailInput } from "@/lib/mail-agent/normalize";
import { getNextMailSendAt, isMailSendWindowOpen } from "@/lib/mail-agent/schedule";
import {
  getAutoReplyBlockReasons,
  preservesProtectedLiterals,
} from "@/lib/mail-agent/safety";
import { sendSharedMail } from "@/lib/mail-agent/smtp";

export const considerMailAutomation = async (
  messageId: string,
  embedding: number[]
) => {
  const message = await db.mailMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: { suggestion: true },
  });
  const suggestion = message.suggestion;
  if (!suggestion || suggestion.status !== "READY" || !suggestion.body || !suggestion.intent) {
    return { queued: false, reasons: ["sin_sugerencia"] };
  }
  const exactHash = hashMailInput(message.subject, message.bodyText);
  const exact = await db.mailAutoReplyRule.findFirst({
    where: { status: "ACTIVE", normalizedInputHash: exactHash },
  });
  const semantic = exact ? [] : await findSemanticMailRules(embedding);
  const semanticMatch = semantic[0];
  const rule = exact ?? (semanticMatch
    ? await db.mailAutoReplyRule.findUnique({ where: { id: semanticMatch.id } })
    : null);
  const similarity = exact ? 1 : semanticMatch?.similarity ?? 0;
  if (!rule || similarity < rule.similarityThreshold) {
    return { queued: false, reasons: ["sin_regla_similar"] };
  }
  const knownSender = Boolean(
    await db.mailMessage.findFirst({
      where: { direction: "OUTBOUND", state: "SENT", toAddresses: { has: message.fromAddress } },
      select: { id: true },
    })
  );
  const reasons = getAutoReplyBlockReasons({
    fromAddress: message.fromAddress,
    recipientCount: message.toAddresses.length + message.ccAddresses.length,
    hasAttachments: message.hasAttachments || message.requiresHandoff,
    listId: message.listId,
    autoSubmitted: message.autoSubmitted,
    subject: message.subject,
    body: message.bodyText,
    knownSender,
  });
  if (suggestion.isComplex) reasons.push("respuesta_compleja");
  if (suggestion.intent !== rule.intent) reasons.push("intencion_distinta");
  if ((suggestion.confidence ?? 0) < 0.95) reasons.push("confianza_baja");
  if ((suggestion.safetyConfidence ?? 0) < 0.95) reasons.push("seguridad_baja");
  if (!preservesProtectedLiterals(rule.protectedLiterals, suggestion.body)) {
    reasons.push("literales_protegidos_modificados");
  }
  const settings = await db.mailSettings.upsert({
    where: { id: "shared" },
    create: { id: "shared" },
    update: {},
  });
  if (!settings.autoSendEnabled) reasons.push("envio_automatico_desactivado");
  if (reasons.length) {
    await recordMailAudit({
      action: "automation.blocked",
      entityType: "MailMessage",
      entityId: message.id,
      metadata: { ruleId: rule.id, similarity, reasons },
    });
    return { queued: false, reasons };
  }
  const queue = await db.mailAutoReplyQueue.upsert({
    where: { inboundMessageId: message.id },
    create: {
      inboundMessageId: message.id,
      ruleId: rule.id,
      suggestionId: suggestion.id,
      scheduledFor: getNextMailSendAt(new Date()),
      idempotencyKey: `auto:${message.id}:${randomUUID()}`,
    },
    update: {},
  });
  await db.mailAutoReplyRule.update({
    where: { id: rule.id },
    data: { lastMatchedAt: new Date() },
  });
  await recordMailAudit({
    action: "automation.queued",
    entityType: "MailAutoReplyQueue",
    entityId: queue.id,
    metadata: { ruleId: rule.id, similarity },
  });
  return { queued: true, reasons: [] };
};

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
    include: { rule: true, suggestion: { include: { message: true } } },
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
      await db.mailAutoReplyQueue.update({
        where: { id: item.id },
        data: { status: "CANCELLED", cancelReason: "rule_not_active", leaseUntil: null },
      });
      continue;
    }
    const inbound = item.suggestion.message;
    const latest = await db.mailMessage.findFirst({
      where: { threadId: inbound.threadId, direction: "INBOUND" },
      orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });
    if (latest?.id !== inbound.id) {
      await db.mailAutoReplyQueue.update({
        where: { id: item.id },
        data: { status: "CANCELLED", cancelReason: "new_follow_up", leaseUntil: null },
      });
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
