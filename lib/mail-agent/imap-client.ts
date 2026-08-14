import { ImapFlow, type ListResponse } from "imapflow";

import { getMailRuntimeConfig } from "@/lib/mail-agent/config";
import {
  resolveMailboxFolders as resolveFolders,
  type MailboxFolder,
} from "@/lib/mail-agent/mail-folders";

export { getCustomMailFolderKey } from "@/lib/mail-agent/mail-folders";
export type { MailboxFolder } from "@/lib/mail-agent/mail-folders";

export type SyncFolder = {
  key: string;
  path: string;
  archived: boolean;
};

export const createMailImapClient = () => {
  const config = getMailRuntimeConfig();
  return new ImapFlow({
    ...config.imap,
    auth: config.auth,
    logger: false,
    emitLogs: false,
  });
};

export const resolveMailboxFolders = (
  mailboxes: ListResponse[],
  sentFolderOverride?: string
): MailboxFolder[] =>
  resolveFolders(mailboxes, sentFolderOverride ?? getMailRuntimeConfig().sentFolder);

export const resolveSyncFolders = (mailboxes: ListResponse[]): SyncFolder[] =>
  resolveMailboxFolders(mailboxes)
    .filter(({ key }) => key === "INBOX" || key === "SENT" || key === "ARCHIVE")
    .map(({ key, path, archived }) => ({ key, path, archived }));
