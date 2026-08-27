"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { reviseMailDraftWithLuna } from "@/lib/mail-agent/conversational-draft";
import { appendMailDraftRevision } from "@/lib/mail-agent/draft-revisions";
import { getMailSafetyIdentifier } from "@/lib/mail-agent/openai-client";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  mailDraftContentSchema,
  mailDraftFeedbackSchema,
  mailDraftRestoreSchema,
  mailDraftRevisionRequestSchema,
} from "@/schemas/mail";

const refresh = () => revalidatePath("/dashboard/email");
const errorResult = (error: unknown, fallback: string) => ({
  error: error instanceof Error ? error.message : fallback,
});

export const saveMailDraftAction = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailDraftContentSchema.parse(input);
    const revision = await appendMailDraftRevision({
      ...parsed,
      origin: "MANUAL",
      actorId: session.user.id,
      instruction: "Edición manual",
      recordSaved: true,
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: "draft.saved",
      entityType: "MailDraftRevision",
      entityId: revision.id,
      metadata: { suggestionId: parsed.suggestionId, revision: revision.revision },
    });
    refresh();
    return { success: true };
  } catch (error) {
    return errorResult(error, "No se pudo guardar el borrador");
  }
};

export const reviseMailDraftWithLunaAction = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailDraftRevisionRequestSchema.parse(input);
    const revision = await reviseMailDraftWithLuna({
      ...parsed,
      actorId: session.user.id,
      safetyIdentifier: getMailSafetyIdentifier(session.user.id),
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: "draft.revised_with_luna",
      entityType: "MailDraftRevision",
      entityId: revision.id,
      metadata: { suggestionId: parsed.suggestionId, revision: revision.revision },
    });
    refresh();
    return { success: true };
  } catch (error) {
    return errorResult(error, "Luna no pudo revisar el borrador");
  }
};

export const restoreMailDraftRevisionAction = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailDraftRestoreSchema.parse(input);
    const source = await db.mailDraftRevision.findFirstOrThrow({
      where: { id: parsed.revisionId, suggestionId: parsed.suggestionId },
    });
    const revision = await appendMailDraftRevision({
      suggestionId: parsed.suggestionId,
      subject: source.subject,
      body: source.body,
      origin: "RESTORED",
      actorId: session.user.id,
      instruction: `Restaurada desde v${source.revision}`,
      restoredFromRevision: source.revision,
      copySourcesFromRevisionId: source.id,
      recordSaved: true,
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: "draft.restored",
      entityType: "MailDraftRevision",
      entityId: revision.id,
      metadata: { fromRevision: source.revision, revision: revision.revision },
    });
    refresh();
    return { success: true };
  } catch (error) {
    return errorResult(error, "No se pudo restaurar la revisión");
  }
};

export const recordMailDraftFeedbackAction = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailDraftFeedbackSchema.parse(input);
    const revision = await db.mailDraftRevision.findFirstOrThrow({
      where: { id: parsed.revisionId, suggestionId: parsed.suggestionId },
      include: { suggestion: { select: { messageId: true } } },
    });
    const feedback = await db.$transaction(async (tx) => {
      const created = await tx.mailDraftFeedback.create({
        data: {
          suggestionId: parsed.suggestionId,
          sourceMessageId: revision.suggestion.messageId,
          revisionId: revision.id,
          actorId: session.user.id,
          outcome: parsed.outcome,
          reason: parsed.reason,
          comment: parsed.comment || null,
          originalBody: revision.body,
          finalBody: revision.body,
        },
      });
      if (parsed.outcome === "EXTERNAL_SENT") {
        await tx.mailSuggestion.update({
          where: { id: parsed.suggestionId },
          data: { status: "SENT", reviewedById: session.user.id, reviewedAt: new Date() },
        });
      }
      return created;
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: `draft.${parsed.outcome.toLowerCase()}`,
      entityType: "MailDraftFeedback",
      entityId: feedback.id,
      metadata: { revisionId: revision.id, reason: parsed.reason ?? null },
    });
    refresh();
    return { success: true };
  } catch (error) {
    return errorResult(error, "No se pudo registrar el resultado");
  }
};
