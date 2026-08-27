import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { findSemanticMailRules } from "@/lib/mail-agent/embedding";
import { hashMailInput } from "@/lib/mail-agent/normalize";
import {
  getGroundedPriceMismatch,
  getOfficialSourceAmounts,
  hasUngroundedQuotedPrice,
} from "@/lib/mail-agent/price-grounding";
import { getNextMailSendAt } from "@/lib/mail-agent/schedule";
import {
  getAutoReplyBlockReasons,
  preservesProtectedLiterals,
} from "@/lib/mail-agent/safety";

export { processMailAutoReplyQueue } from "@/lib/mail-agent/automation-queue";

export const considerMailAutomation = async (
  messageId: string,
  embedding: number[]
) => {
  const message = await db.mailMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: {
      suggestion: {
        include: {
          revisions: {
            orderBy: { revision: "desc" },
            take: 1,
            include: { sources: { include: { officialBudgetOption: true } } },
          },
        },
      },
    },
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
    allowGroundedPrice: (suggestion.revisions[0]?.sources.length ?? 0) > 0,
  });
  if (suggestion.isComplex) reasons.push("respuesta_compleja");
  if (suggestion.intent !== rule.intent) reasons.push("intencion_distinta");
  if ((suggestion.confidence ?? 0) < 0.95) reasons.push("confianza_baja");
  if ((suggestion.safetyConfidence ?? 0) < 0.95) reasons.push("seguridad_baja");
  if (!reasons.includes("precio_sin_fuente_oficial") && hasUngroundedQuotedPrice(
    `${suggestion.subject ?? ""}\n${suggestion.body}`,
    suggestion.revisions[0]?.sources.length ?? 0
  )) {
    reasons.push("precio_sin_fuente_oficial");
  }
  const officialAmounts = getOfficialSourceAmounts(suggestion.revisions[0]?.sources ?? []);
  if (officialAmounts.length && getGroundedPriceMismatch(
    `${suggestion.subject ?? ""}\n${suggestion.body}`,
    officialAmounts
  ).mismatch) {
    reasons.push("precio_no_coincide_con_fuente_oficial");
  }
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
