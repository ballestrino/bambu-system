"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { recordMailAudit } from "@/lib/mail-agent/audit";
import {
  moveMailThread,
  moveMailThreads,
  setMailThreadArchived,
  setMailThreadRead,
  setMailThreadsArchived,
} from "@/lib/mail-agent/mailbox-actions";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  mailArchiveThreadsSchema,
  mailMoveThreadsSchema,
  mailMoveThreadSchema,
} from "@/schemas/mail";

const recordThreadAudits = async ({
  actorId,
  threadIds,
  action,
  metadata,
}: {
  actorId: string;
  threadIds: string[];
  action: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  await Promise.all(
    threadIds.map((threadId) =>
      recordMailAudit({
        actorId,
        action,
        entityType: "MailThread",
        entityId: threadId,
        metadata,
      })
    )
  );
};

export const setMailThreadReadAction = async (threadId: string, read: boolean) => {
  try {
    const session = await requireAdminSession();
    await setMailThreadRead(threadId, read);
    await recordMailAudit({
      actorId: session.user.id,
      action: read ? "thread.read" : "thread.unread",
      entityType: "MailThread",
      entityId: threadId,
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo actualizar" };
  }
};

export const setMailThreadArchivedAction = async (
  threadId: string,
  archived: boolean
) => {
  try {
    const session = await requireAdminSession();
    await setMailThreadArchived(threadId, archived);
    await recordMailAudit({
      actorId: session.user.id,
      action: archived ? "thread.archived" : "thread.restored",
      entityType: "MailThread",
      entityId: threadId,
    });
    revalidatePath("/dashboard/email");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo archivar" };
  }
};

export const moveMailThreadAction = async (threadId: string, folderKey: string) => {
  try {
    const session = await requireAdminSession();
    const input = mailMoveThreadSchema.parse({ threadId, folderKey });
    const destination = await moveMailThread(input.threadId, input.folderKey);
    await recordMailAudit({
      actorId: session.user.id,
      action: "thread.moved",
      entityType: "MailThread",
      entityId: input.threadId,
      metadata: destination,
    });
    revalidatePath("/dashboard/email");
    return { success: true, destination };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo mover" };
  }
};

export const moveMailThreadsAction = async (
  threadIds: string[],
  folderKey: string
) => {
  try {
    const session = await requireAdminSession();
    const input = mailMoveThreadsSchema.parse({ threadIds, folderKey });
    const destination = await moveMailThreads(input.threadIds, input.folderKey);
    await recordThreadAudits({
      actorId: session.user.id,
      threadIds: input.threadIds,
      action: "thread.moved",
      metadata: { ...destination, bulkCount: input.threadIds.length },
    });
    revalidatePath("/dashboard/email");
    return { success: true, destination, count: input.threadIds.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudieron mover" };
  }
};

export const setMailThreadsArchivedAction = async (
  threadIds: string[],
  archived: boolean
) => {
  try {
    const session = await requireAdminSession();
    const input = mailArchiveThreadsSchema.parse({ threadIds, archived });
    const destination = await setMailThreadsArchived(input.threadIds, input.archived);
    await recordThreadAudits({
      actorId: session.user.id,
      threadIds: input.threadIds,
      action: input.archived ? "thread.archived" : "thread.restored",
      metadata: { ...destination, bulkCount: input.threadIds.length },
    });
    revalidatePath("/dashboard/email");
    return { success: true, destination, count: input.threadIds.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudieron archivar" };
  }
};
