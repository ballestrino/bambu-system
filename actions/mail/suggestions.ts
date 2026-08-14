"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { considerMailAutomation } from "@/lib/mail-agent/automation";
import { generateAndStoreMailSuggestion } from "@/lib/mail-agent/draft";
import { getMailSafetyIdentifier } from "@/lib/mail-agent/openai-client";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { requireAdminSession } from "@/lib/require-admin-session";

export const generateMailSuggestionAction = async (messageId: string) => {
  try {
    const session = await requireAdminSession();
    const generated = await generateAndStoreMailSuggestion(
      messageId,
      getMailSafetyIdentifier(session.user.id),
      session.user.id
    );
    await considerMailAutomation(messageId, generated.embedding);
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo generar" };
  }
};
export const rejectMailSuggestionAction = async (suggestionId: string) => {
  try {
    const session = await requireAdminSession();
    const suggestion = await db.mailSuggestion.update({
      where: { id: suggestionId },
      data: { status: "REJECTED", reviewedById: session.user.id, reviewedAt: new Date() },
    });
    await db.mailDraftFeedback.create({
      data: {
        suggestionId,
        sourceMessageId: suggestion.messageId,
        actorId: session.user.id,
        outcome: "REJECTED",
        originalBody: suggestion.body,
      },
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: "suggestion.rejected",
      entityType: "MailSuggestion",
      entityId: suggestionId,
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo rechazar" };
  }
};
