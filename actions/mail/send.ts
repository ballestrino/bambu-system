"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { MAIL_ATTACHMENT_LIMIT_BYTES } from "@/lib/mail-agent/config";
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
    const attachments = await readAttachments(formData);
    const outgoing = await sendSharedMail(
      { ...parsed, attachments, suggestionId },
      session.user.id
    );
    if (suggestionId) {
      const suggestion = await db.mailSuggestion.findUnique({
        where: { id: suggestionId },
        select: { body: true, messageId: true },
      });
      if (suggestion) {
        await db.mailDraftFeedback.create({
          data: {
            suggestionId,
            sourceMessageId: suggestion.messageId,
            actorId: session.user.id,
            outcome: suggestion.body === parsed.body ? "ACCEPTED" : "EDITED",
            originalBody: suggestion.body,
            finalBody: parsed.body,
          },
        });
      }
    }
    revalidatePath("/dashboard/email");
    return { success: true, messageId: outgoing.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar" };
  }
};
