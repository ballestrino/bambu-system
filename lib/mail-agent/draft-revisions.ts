import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type SourceReference = {
  officialBudgetVersionId: string;
  officialBudgetOptionId: string;
};

type DraftAnalysis = {
  intent: string;
  isComplex: boolean;
  riskLevel: string;
  confidence: number;
  safetyConfidence: number;
  manualReviewRequired: boolean;
  reasons: string[];
  protectedLiterals: string[];
};

type AppendInput = {
  suggestionId: string;
  subject: string;
  body: string;
  origin: "AI" | "MANUAL" | "RESTORED";
  actorId: string;
  instruction?: string;
  restoredFromRevision?: number;
  copySourcesFromRevisionId?: string;
  sources?: SourceReference[];
  analysis?: DraftAnalysis;
  recordSaved?: boolean;
};

const sourceSelect = {
  officialBudgetVersionId: true,
  officialBudgetOptionId: true,
} as const;

export const appendMailDraftRevision = (input: AppendInput) =>
  db.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT "id" FROM "MailSuggestion" WHERE "id" = ${input.suggestionId} FOR UPDATE`
    );
    const latest = await tx.mailDraftRevision.findFirst({
      where: { suggestionId: input.suggestionId },
      orderBy: { revision: "desc" },
      select: { id: true, revision: true },
    });
    if (!latest) throw new Error("El borrador no tiene una revisión base");

    const copyFromId = input.copySourcesFromRevisionId ?? latest.id;
    const copiedSources = input.sources ?? await tx.mailDraftSource.findMany({
      where: {
        revisionId: copyFromId,
        revision: { suggestionId: input.suggestionId },
      },
      select: sourceSelect,
    });
    if (input.copySourcesFromRevisionId && !copiedSources.length) {
      const sourceRevision = await tx.mailDraftRevision.findFirst({
        where: { id: copyFromId, suggestionId: input.suggestionId },
        select: { id: true },
      });
      if (!sourceRevision) throw new Error("La revisión a restaurar no pertenece al borrador");
    }

    const revision = await tx.mailDraftRevision.create({
      data: {
        suggestionId: input.suggestionId,
        revision: latest.revision + 1,
        subject: input.subject,
        body: input.body,
        origin: input.origin,
        instruction: input.instruction,
        actorId: input.actorId,
        restoredFromRevision: input.restoredFromRevision,
        manualReviewRequired: input.analysis?.manualReviewRequired ?? true,
        sources: { create: copiedSources },
      },
    });
    await tx.mailSuggestion.update({
      where: { id: input.suggestionId },
      data: {
        status: "READY",
        subject: input.subject,
        body: input.body,
        ...(input.analysis
          ? {
              intent: input.analysis.intent,
              isComplex: input.analysis.isComplex,
              riskLevel: input.analysis.riskLevel,
              confidence: input.analysis.confidence,
              safetyConfidence: input.analysis.safetyConfidence,
              manualReviewRequired: input.analysis.manualReviewRequired,
              reasons: input.analysis.reasons,
              protectedLiterals: input.analysis.protectedLiterals,
            }
          : { manualReviewRequired: true }),
      },
    });
    await tx.mailAutoReplyQueue.updateMany({
      where: {
        suggestionId: input.suggestionId,
        status: { in: ["QUEUED", "PROCESSING"] },
      },
      data: { status: "CANCELLED", cancelReason: "draft_revised", leaseUntil: null },
    });
    if (input.recordSaved) {
      await tx.mailDraftFeedback.create({
        data: {
          suggestionId: input.suggestionId,
          sourceMessageId: (
            await tx.mailSuggestion.findUniqueOrThrow({
              where: { id: input.suggestionId },
              select: { messageId: true },
            })
          ).messageId,
          revisionId: revision.id,
          actorId: input.actorId,
          outcome: "SAVED",
          finalBody: input.body,
        },
      });
    }
    return revision;
  });

export const resolveMailDraftRevision = async (input: {
  suggestionId: string;
  revisionId?: string;
  subject: string;
  body: string;
  actorId: string;
}) => {
  const selected = input.revisionId
    ? await db.mailDraftRevision.findFirst({
        where: { id: input.revisionId, suggestionId: input.suggestionId },
      })
    : null;
  if (input.revisionId && !selected) {
    throw new Error("La revisión seleccionada no pertenece al borrador");
  }
  if (selected?.subject === input.subject && selected.body === input.body) return selected;
  return appendMailDraftRevision({
    suggestionId: input.suggestionId,
    subject: input.subject,
    body: input.body,
    origin: "MANUAL",
    actorId: input.actorId,
    copySourcesFromRevisionId: selected?.id,
    instruction: "Edición realizada antes del resultado final",
    recordSaved: true,
  });
};
