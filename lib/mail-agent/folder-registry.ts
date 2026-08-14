import { db } from "@/lib/db";
import type { MailboxFolder } from "@/lib/mail-agent/imap-client";

export const registerCustomMailFolders = async (folders: MailboxFolder[]) => {
  const custom = folders.filter(({ custom }) => custom);
  if (!custom.length) return 0;
  await db.$transaction(
    custom.map((folder) =>
      db.mailFolderCursor.upsert({
        where: { folderKey: folder.key },
        create: {
          folderKey: folder.key,
          displayName: folder.label,
          initialImportComplete: true,
        },
        update: { displayName: folder.label },
      })
    )
  );
  return custom.length;
};
