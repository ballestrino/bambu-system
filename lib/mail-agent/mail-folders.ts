type ListedMailFolder = {
  path: string;
  name: string;
  parent: string[];
  flags: Set<string>;
  specialUse?: string;
  listed: boolean;
};

export type MailboxFolder = {
  key: string;
  path: string;
  label: string;
  archived: boolean;
  selectable: boolean;
  custom: boolean;
};

export const getCustomMailFolderKey = (path: string) => `CUSTOM:${path}`;

const specialUsePath = (mailboxes: ListedMailFolder[], specialUse: string) =>
  mailboxes.find((mailbox) => mailbox.specialUse === specialUse)?.path;

const getCustomLabel = (mailbox: ListedMailFolder) =>
  [...mailbox.parent.filter((part) => part.toUpperCase() !== "INBOX"), mailbox.name]
    .filter(Boolean)
    .join(" / ");

const getConventionalArchivePath = (mailboxes: ListedMailFolder[]) => {
  const archiveNames = new Set(["archive", "archives", "archivo"]);
  return mailboxes.find(
    (mailbox) =>
      mailbox.parent.every((part) => part.toUpperCase() === "INBOX") &&
      archiveNames.has(mailbox.name.trim().toLowerCase())
  )?.path;
};

export const resolveMailboxFolders = (
  mailboxes: ListedMailFolder[],
  sentFolder: string
): MailboxFolder[] => {
  const listedPaths = new Set(mailboxes.map((mailbox) => mailbox.path));
  const sent = specialUsePath(mailboxes, "\\Sent") ||
    (listedPaths.has(sentFolder) ? sentFolder : undefined);
  const archive =
    specialUsePath(mailboxes, "\\Archive") || getConventionalArchivePath(mailboxes);
  const standardPaths = new Set(["INBOX", sent, archive].filter(Boolean));
  const standard: MailboxFolder[] = [
    { key: "INBOX", path: "INBOX", label: "Recibidos", archived: false, selectable: true, custom: false },
    ...(sent
      ? [{ key: "SENT", path: sent, label: "Enviados", archived: false, selectable: false, custom: false }]
      : []),
    ...(archive
      ? [{ key: "ARCHIVE", path: archive, label: "Archivo", archived: true, selectable: true, custom: false }]
      : []),
  ];
  const custom = mailboxes
    .filter(
      (mailbox) =>
        mailbox.listed &&
        !standardPaths.has(mailbox.path) &&
        !mailbox.specialUse &&
        !mailbox.flags.has("\\Noselect")
    )
    .map<MailboxFolder>((mailbox) => ({
      key: getCustomMailFolderKey(mailbox.path),
      path: mailbox.path,
      label: getCustomLabel(mailbox),
      archived: false,
      selectable: true,
      custom: true,
    }));
  return [...standard, ...custom];
};
