import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import {
  createMailEmbedding,
  storeMailMessageEmbedding,
} from "@/lib/mail-agent/embedding";
import { generateGroundedDraft } from "@/lib/mail-agent/draft-model";
import { validateGroundedDraft } from "@/lib/mail-agent/grounded-draft";
import { hasQuotedMoney } from "@/lib/mail-agent/price-grounding";
import { getMailRetrievalContext } from "@/lib/mail-agent/retrieval";
import {
  extractProtectedLiterals,
  hasAlwaysManualTopic,
} from "@/lib/mail-agent/safety";
import type { MailSuggestionOutput } from "@/schemas/mail";

const buildInput = (
  message: { subject: string; bodyText: string; fromAddress: string },
  context: Awaited<ReturnType<typeof getMailRetrievalContext>>
) =>
  JSON.stringify({
    incoming: message,
    approvedMemory: context.memories,
    priorSentExamples: context.examples,
    confirmedAutomationRules: context.rules,
  });

export const enforceMailDraftSafety = (
  draft: MailSuggestionOutput,
  message: { subject: string; bodyText: string },
  hasOfficialSources: boolean
) => {
  const literals = extractProtectedLiterals(`${message.subject}\n${message.bodyText}`);
  const sensitive = hasAlwaysManualTopic(message.subject, message.bodyText);
  return {
    ...draft,
    protectedLiterals: [...new Set([...draft.protectedLiterals, ...literals])],
    manualReviewRequired:
      draft.manualReviewRequired ||
      draft.isComplex ||
      sensitive ||
      hasOfficialSources ||
      hasQuotedMoney(draft.body) ||
      draft.riskLevel !== "low",
  };
};

export const generateAndStoreMailSuggestion = async (
  messageId: string,
  safetyIdentifier: string,
  actorId?: string
) => {
  const message = await db.mailMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: { thread: true },
  });
  if (message.direction !== "INBOUND" || message.hasAttachments || message.requiresHandoff) {
    throw new Error("Este mensaje no admite una sugerencia automática");
  }

  await db.mailSuggestion.upsert({
    where: { messageId },
    create: { messageId, status: "PENDING" },
    update: { status: "PENDING", error: null },
  });

  try {
    const embedding = await createMailEmbedding(`${message.subject}\n${message.bodyText}`);
    await storeMailMessageEmbedding(message.id, embedding);
    const context = await getMailRetrievalContext({
      threadId: message.threadId,
      fromAddress: message.fromAddress,
      subject: message.thread.normalizedSubject,
      embedding,
    });
    const input = buildInput(message, context);
    const result = await generateGroundedDraft(input, safetyIdentifier);
    const grounding = validateGroundedDraft(result.draft, result.evidence);
    const draft = enforceMailDraftSafety(result.draft, message, grounding.sources.length > 0);
    const suggestion = await db.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "MailSuggestion" WHERE "messageId" = ${messageId} FOR UPDATE`
      );
      const previous = await tx.mailDraftRevision.findFirst({
        where: { suggestion: { messageId } },
        orderBy: { revision: "desc" },
        select: { revision: true },
      });
      const updated = await tx.mailSuggestion.update({
        where: { messageId },
        data: {
          status: "READY",
          reasoningEffort: "xhigh",
          intent: draft.intent,
          isComplex: draft.isComplex,
          riskLevel: draft.riskLevel,
          confidence: draft.confidence,
          safetyConfidence: draft.safetyConfidence,
          manualReviewRequired: draft.manualReviewRequired,
          subject: draft.subject,
          body: draft.body,
          reasons: draft.reasons,
          protectedLiterals: draft.protectedLiterals,
        },
      });
      await tx.mailDraftRevision.create({
        data: {
          suggestionId: updated.id,
          revision: (previous?.revision ?? 0) + 1,
          subject: draft.subject,
          body: draft.body,
          actorId,
          manualReviewRequired: draft.manualReviewRequired,
          sources: {
            create: grounding.sources.map((source) => ({
              officialBudgetVersionId: source.immutableVersion.id,
              officialBudgetOptionId: source.sourceOptionId,
            })),
          },
        },
      });
      return updated;
    });
    if (draft.memories.length) {
      await db.mailMemory.createMany({
        data: draft.memories.map((memory) => ({
          ...memory,
          sourceMessageId: message.id,
          status: "PENDING" as const,
        })),
      });
    }
    await recordMailAudit({
      actorId,
      action: "suggestion.ready",
      entityType: "MailSuggestion",
      entityId: suggestion.id,
      metadata: { effort: suggestion.reasoningEffort, complex: suggestion.isComplex },
    });
    return { suggestion, embedding };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Error desconocido";
    await db.mailSuggestion.update({
      where: { messageId },
      data: { status: "FAILED", error: messageText },
    });
    throw error;
  }
};
