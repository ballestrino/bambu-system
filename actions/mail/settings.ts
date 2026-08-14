"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { requireAdminSession } from "@/lib/require-admin-session";

export const setMailAutoSendAction = async (enabled: boolean) => {
  try {
    const session = await requireAdminSession();
    await db.mailSettings.upsert({
      where: { id: "shared" },
      create: { id: "shared", autoSendEnabled: enabled, updatedById: session.user.id },
      update: { autoSendEnabled: enabled, updatedById: session.user.id },
    });
    await recordMailAudit({
      actorId: session.user.id,
      action: enabled ? "settings.auto_send_enabled" : "settings.auto_send_disabled",
      entityType: "MailSettings",
      entityId: "shared",
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo actualizar" };
  }
};
