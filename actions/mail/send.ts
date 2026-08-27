"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { MAIL_ATTACHMENT_LIMIT_BYTES } from "@/lib/mail-agent/config";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { resolveMailDraftRevision } from "@/lib/mail-agent/draft-revisions";
import {
  getGroundedPriceMismatch,
  getOfficialSourceAmounts,
} from "@/lib/mail-agent/price-grounding";
import { sendSharedMail, type OutboundAttachment } from "@/lib/mail-agent/smtp";
import { requireAdminSession } from "@/lib/require-admin-session";
import { mailComposeSchema } from "@/schemas/mail";

const readAttachments = async (formData: FormData) => {
  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAIL_ATTACHMENT_LIMIT_BYTES) {
    throw new Error("Los adjuntos superan el límite total de 4 MB");
  }
  return Promise.all(
    files.map<Promise<OutboundAttachment>>(async (file) => ({
      filename: file.name.replace(/[\\/]/g, "-").slice(0, 180),
      contentType: file.type || "application/octet-stream",
      content: Buffer.from(await file.arrayBuffer()),
    }))
  );
};
export const sendSharedMailAction = async (formData: FormData) => {
  try {
    const session = await requireAdminSession();
    const parsed = mailComposeSchema.parse({
      threadId: formData.get("threadId") || undefined,
      inReplyToId: formData.get("inReplyToId") || undefined,
      to: formData.get("to"),
      cc: formData.get("cc") || "",
      subject: formData.get("subject"),
      body: formData.get("body"),
    });
    const suggestionId = String(formData.get("suggestionId") || "") || undefined;
    const draftRevisionId = String(formData.get("draftRevisionId") || "") || undefined;
    const attachments = await readAttachments(formData);
    const usedRevision = suggestionId
      ? await resolveMailDraftRevision({
          suggestionId,
          revisionId: draftRevisionId,
          subject: parsed.subject,
          body: parsed.body,
          actorId: session.user.id,
        })
      : null;
    const outgoing = await sendSharedMail(
      { ...parsed, attachments, suggestionId },
      session.user.id
    );
    if (suggestionId) {
      const suggestion = await db.mailSuggestion.findUnique({
        where: { id: suggestionId },
        select: {
          messageId: true,
          revisions: {
            where: { id: usedRevision?.id },
            select: {
              id: true,
              body: true,
              sources: {
                select: {
                  officialBudgetOption: {
                    select: {
                      netPrice: true,
                      ivaAmount: true,
                      finalPrice: true,
                      hourlyPrice: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const revision = suggestion?.revisions[0];
      if (suggestion && revision) {
        const allowedAmounts = getOfficialSourceAmounts(revision.sources);
        const priceMismatch = getGroundedPriceMismatch(parsed.body, allowedAmounts);
        await db.mailDraftFeedback.create({
          data: {
            suggestionId,
            sourceMessageId: suggestion.messageId,
            revisionId: revision.id,
            actorId: session.user.id,
            outcome: "BAMBU_SENT",
            originalBody: revision.body,
            finalBody: parsed.body,
          },
        });
        if (allowedAmounts.length) {
          await recordMailAudit({
            actorId: session.user.id,
            action: priceMismatch.mismatch
              ? "official_price.sent_with_mismatch"
              : "official_price.sent_reviewed",
            entityType: "MailSuggestion",
            entityId: suggestionId,
            metadata: { mismatches: priceMismatch.mismatches },
          });
        }
        await recordMailAudit({
          actorId: session.user.id,
          action: "draft.bambu_sent",
          entityType: "MailDraftRevision",
          entityId: revision.id,
          metadata: { suggestionId, outgoingMessageId: outgoing.id },
        });
      }
    }
    revalidatePath("/dashboard/email");
    return { success: true, messageId: outgoing.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar" };
  }
};
