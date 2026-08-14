"use server";

import { revalidatePath } from "next/cache";

import { syncSharedMailbox } from "@/lib/mail-agent/sync";
import { requireAdminSession } from "@/lib/require-admin-session";

export const syncSharedMailboxAction = async () => {
  try {
    const session = await requireAdminSession();
    const result = await syncSharedMailbox("manual", session.user.id);
    revalidatePath("/dashboard/email");
    return { success: true, result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo sincronizar" };
  }
};
