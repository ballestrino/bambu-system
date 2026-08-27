"use server";

import { revalidatePath } from "next/cache";

import { considerMailAutomation } from "@/lib/mail-agent/automation";
import { generateAndStoreMailSuggestion } from "@/lib/mail-agent/draft";
import { getMailSafetyIdentifier } from "@/lib/mail-agent/openai-client";
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
