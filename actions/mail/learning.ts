"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import {
  createMailEmbedding,
  storeMailMemoryEmbedding,
  storeMailRuleEmbedding,
} from "@/lib/mail-agent/embedding";
import { hashMailInput } from "@/lib/mail-agent/normalize";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { extractProtectedLiterals } from "@/lib/mail-agent/safety";
import { requireAdminSession } from "@/lib/require-admin-session";
import { mailMemoryReviewSchema, mailRuleReviewSchema } from "@/schemas/mail";

export const createMailAutomationRuleAction = async (suggestionId: string) => {
  try {
    const session = await requireAdminSession();
    const suggestion = await db.mailSuggestion.findUniqueOrThrow({
      where: { id: suggestionId },
      include: { message: true },
    });
    if (!suggestion.body || !suggestion.subject || !suggestion.intent) {
      throw new Error("La sugerencia todavía no está lista");
    }
    if (suggestion.isComplex) {
      throw new Error("Las respuestas complejas no pueden automatizarse");
    }
    const input = `${suggestion.message.subject}\n${suggestion.message.bodyText}`;
    const embedding = await createMailEmbedding(input);
    const rule = await db.mailAutoReplyRule.create({
      data: {
        name: suggestion.message.subject.slice(0, 120),
        exampleMessageId: suggestion.message.id,
        exampleReplySubject: suggestion.subject,
        exampleReplyBody: suggestion.body,
        normalizedInputHash: hashMailInput(
          suggestion.message.subject,
          suggestion.message.bodyText
        ),
        intent: suggestion.intent,
        protectedLiterals: [
          ...new Set([
            ...suggestion.protectedLiterals,
            ...extractProtectedLiterals(suggestion.body),
          ]),
        ],
        createdById: session.user.id,
      },
    });
    await storeMailRuleEmbedding(rule.id, embedding);
    await db.mailSuggestion.update({
      where: { id: suggestion.id },
      data: { status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() },
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: "rule.created",
      entityType: "MailAutoReplyRule",
      entityId: rule.id,
      metadata: { sourceSuggestionId: suggestion.id },
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo crear la regla" };
  }
};

export const reviewMailMemoryAction = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailMemoryReviewSchema.parse(input);
    const memory = await db.mailMemory.update({
      where: { id: parsed.id },
      data: {
        status: parsed.decision,
        approvedById: parsed.decision === "APPROVED" ? session.user.id : null,
        approvedAt: parsed.decision === "APPROVED" ? new Date() : null,
      },
    });
    if (parsed.decision === "APPROVED") {
      await storeMailMemoryEmbedding(
        memory.id,
        await createMailEmbedding(`${memory.key}\n${memory.value}`)
      );
    }
    await recordMailAudit({
      actorId: session.user.id,
      action: `memory.${parsed.decision.toLowerCase()}`,
      entityType: "MailMemory",
      entityId: memory.id,
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo revisar" };
  }
};

export const updateMailRuleStatusAction = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailRuleReviewSchema.parse(input);
    await db.mailAutoReplyRule.update({
      where: { id: parsed.id },
      data: { status: parsed.status },
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: `rule.${parsed.status.toLowerCase()}`,
      entityType: "MailAutoReplyRule",
      entityId: parsed.id,
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo actualizar" };
  }
};
