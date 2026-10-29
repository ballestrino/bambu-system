import "server-only";

import { ImapFlow } from "imapflow";

import type { MailboxAccount, MailboxFolderId } from "@/lib/mailbox/accounts";

// Una conexión por lectura: el agente lee pocas veces por turno y Vercel no
// conserva conexiones entre pedidos. Los tiempos cortan un Hostinger colgado
// antes que el maxDuration del turno.
const CONNECT_TIMEOUT_MS = 15_000;
const SOCKET_TIMEOUT_MS = 30_000;

const resolveFolderPath = async (client: ImapFlow, account: MailboxAccount, folder: MailboxFolderId) => {
  if (folder === "inbox") return "INBOX";
  const boxes = await client.list();
  return (
    boxes.find((box) => box.specialUse === "\\Sent")?.path ??
    boxes.find((box) => box.path === account.sentFolder)?.path ??
    account.sentFolder
  );
};

// Abre la carpeta con EXAMINE (readOnly): el servidor no deja cambiar flags,
// y las lecturas usan BODY.PEEK (imapflow), así que nada queda como leído.
export const withMailboxFolder = async <T>(
  account: MailboxAccount,
  folder: MailboxFolderId,
  run: (client: ImapFlow) => Promise<T>
): Promise<T> => {
  const client = new ImapFlow({
    ...account.imap,
    auth: account.auth,
    logger: false,
    emitLogs: false,
    connectionTimeout: CONNECT_TIMEOUT_MS,
    greetingTimeout: CONNECT_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
  });
  await client.connect();
  try {
    const lock = await client.getMailboxLock(await resolveFolderPath(client, account, folder), {
      readOnly: true,
    });
    try {
      return await run(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
};
