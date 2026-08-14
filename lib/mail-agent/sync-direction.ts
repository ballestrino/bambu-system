export const getSyncedMailDirection = (
  folderKey: string,
  fromAddress: string,
  mailboxAddress: string
) => {
  if (folderKey === "INBOX") return "INBOUND" as const;
  if (folderKey === "SENT") return "OUTBOUND" as const;
  return fromAddress === mailboxAddress ? "OUTBOUND" as const : "INBOUND" as const;
};
