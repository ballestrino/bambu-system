import type { ImapFlow } from "imapflow";

import {
  resolveMailboxFolders,
  type MailboxFolder,
} from "@/lib/mail-agent/imap-client";

export const resolveMoveFolders = async (
  client: ImapFlow,
  destinationKey: string
): Promise<MailboxFolder[]> => {
  let folders = resolveMailboxFolders(await client.list());
  if (destinationKey !== "ARCHIVE" || folders.some(({ key }) => key === "ARCHIVE")) {
    return folders;
  }

  await client.mailboxCreate(["INBOX", "Archive"]).catch(() => undefined);
  folders = resolveMailboxFolders(await client.list());
  if (!folders.some(({ key }) => key === "ARCHIVE")) {
    throw new Error("Hostinger no permitió preparar la carpeta Archivo");
  }
  return folders;
};
