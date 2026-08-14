import { db } from "@/lib/db";
import { resolveMoveFolders } from "@/lib/mail-agent/archive-folder";
import { registerCustomMailFolders } from "@/lib/mail-agent/folder-registry";
import {
  createMailImapClient,
  resolveMailboxFolders,
  type MailboxFolder,
} from "@/lib/mail-agent/imap-client";
import { refreshMailThreadStats } from "@/lib/mail-agent/persist-message";

type RemoteMessage = {
  id: string;
  threadId: string;
  folderKey: string;
  providerUid: string;
  uidValidity: string;
};

const isRemoteMessage = (message: RemoteMessage) =>
  message.uidValidity !== "local" && /^\d+$/.test(message.providerUid);

const withRemoteMessages = async (
  messages: RemoteMessage[],
  operation: (input: {
    client: ReturnType<typeof createMailImapClient>;
    folder: MailboxFolder;
    uids: number[];
  }) => Promise<void>
) => {
  const remote = messages.filter(isRemoteMessage);
  if (!remote.length) return;
  const client = createMailImapClient();
  try {
    await client.connect();
    const folders = resolveMailboxFolders(await client.list());
    for (const folderKey of [...new Set(remote.map(({ folderKey }) => folderKey))]) {
      const folder = folders.find(({ key }) => key === folderKey);
      if (!folder) continue;
      const uids = remote
        .filter((message) => message.folderKey === folderKey)
        .map(({ providerUid }) => Number(providerUid));
      await operation({ client, folder, uids });
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
};

export const setMailThreadsRead = async (threadIds: string[], read: boolean) => {
  const messages = await db.mailMessage.findMany({
    where: { threadId: { in: threadIds }, direction: "INBOUND" },
    select: {
      id: true,
      threadId: true,
      folderKey: true,
      providerUid: true,
      uidValidity: true,
    },
  });
  await withRemoteMessages(messages, async ({ client, folder, uids }) => {
    const lock = await client.getMailboxLock(folder.path);
    try {
      if (read) await client.messageFlagsAdd(uids, ["\\Seen"], { uid: true });
      else await client.messageFlagsRemove(uids, ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
  });
  await db.$transaction(async (tx) => {
    await tx.mailMessage.updateMany({
      where: { threadId: { in: threadIds }, direction: "INBOUND" },
      data: { isRead: read },
    });
    if (read) {
      await tx.mailThread.updateMany({
        where: { id: { in: threadIds } },
        data: { unreadCount: 0 },
      });
      return;
    }
    await Promise.all(
      threadIds.map((threadId) =>
        tx.mailThread.update({
          where: { id: threadId },
          data: {
            unreadCount: messages.filter((message) => message.threadId === threadId).length,
          },
        })
      )
    );
  });
};

export const setMailThreadRead = async (threadId: string, read: boolean) =>
  setMailThreadsRead([threadId], read);

export const moveMailThreads = async (threadIds: string[], destinationKey: string) => {
  const uniqueThreadIds = [...new Set(threadIds)];
  const messages = await db.mailMessage.findMany({
    where: { threadId: { in: uniqueThreadIds }, direction: "INBOUND" },
    select: {
      id: true,
      threadId: true,
      folderKey: true,
      providerUid: true,
      uidValidity: true,
    },
  });
  const movableThreadIds = new Set(messages.map(({ threadId }) => threadId));
  if (uniqueThreadIds.some((threadId) => !movableThreadIds.has(threadId))) {
    throw new Error("Algún hilo no tiene mensajes recibidos para mover");
  }
  const remote = messages.filter(isRemoteMessage);
  const client = createMailImapClient();
  let destination: MailboxFolder | undefined;
  try {
    await client.connect();
    const folders = await resolveMoveFolders(client, destinationKey);
    await registerCustomMailFolders(folders);
    destination = folders.find(({ key, selectable }) => key === destinationKey && selectable);
    if (!destination) throw new Error("La carpeta de destino no está disponible en Hostinger");
    for (const sourceKey of [...new Set(remote.map(({ folderKey }) => folderKey))]) {
      if (sourceKey === destination.key) continue;
      const source = folders.find(({ key }) => key === sourceKey);
      if (!source) throw new Error("La carpeta de origen ya no está disponible en Hostinger");
      const sourceMessages = remote.filter(({ folderKey }) => folderKey === sourceKey);
      const lock = await client.getMailboxLock(source.path);
      try {
        const moved = await client.messageMove(
          sourceMessages.map(({ providerUid }) => Number(providerUid)),
          destination.path,
          { uid: true }
        );
        if (!moved) throw new Error("Hostinger no confirmó el movimiento del mensaje");
        const uidValidity = moved && moved.uidValidity
          ? String(moved.uidValidity)
          : `moved:${Date.now()}`;
        await db.$transaction(
          sourceMessages.map((message) => {
            const providerUid = moved && moved.uidMap?.get(Number(message.providerUid));
            return db.mailMessage.update({
              where: { id: message.id },
              data: {
                folderKey: destination!.key,
                uidValidity,
                providerUid: providerUid ? String(providerUid) : `moved:${message.id}`,
              },
            });
          })
        );
      } finally {
        lock.release();
      }
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
  if (!destination) throw new Error("No se pudo resolver la carpeta de destino");
  const archived = destination.key === "ARCHIVE";
  await db.$transaction([
    db.mailThread.updateMany({
      where: { id: { in: uniqueThreadIds } },
      data: { isArchived: archived },
    }),
    db.mailMessage.updateMany({
      where: { threadId: { in: uniqueThreadIds }, direction: "INBOUND" },
      data: { folderKey: destination.key, isArchived: archived },
    }),
  ]);
  for (const threadId of uniqueThreadIds) await refreshMailThreadStats(threadId);
  return { folderKey: destination.key, label: destination.label };
};

export const moveMailThread = async (threadId: string, destinationKey: string) =>
  moveMailThreads([threadId], destinationKey);

export const setMailThreadsArchived = async (threadIds: string[], archived: boolean) => {
  const result = await moveMailThreads(threadIds, archived ? "ARCHIVE" : "INBOX");
  if (archived) await setMailThreadsRead(threadIds, true);
  return result;
};

export const setMailThreadArchived = async (threadId: string, archived: boolean) => {
  return setMailThreadsArchived([threadId], archived);
};
