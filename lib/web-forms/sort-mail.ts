import "server-only";

import { ImapFlow } from "imapflow";

import { resolveMailboxAccount } from "@/lib/mailbox/accounts";
import { db } from "@/lib/db";
import { findFolderPath, planMailSort, WEB_FORM_MAIL_FOLDERS, type MailNotice } from "@/lib/web-forms/mail-sorting";
import type { WebFormKindValue } from "@/lib/web-forms/reply-text";

// La única escritura en un buzón fuera de Enviados: mueve avisos de la web de
// la Bandeja de entrada de contacto@ a su carpeta. Las lecturas del agente
// siguen en solo lectura (lib/mailbox/imap.ts).
const TIMEOUT_MS = 15_000;

export type SortMailOutcome = { success: string; moved: number; unmatched: number } | { error: string };

const toDate = (value: Date | string | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const sortWebFormMail = async (kind: WebFormKindValue): Promise<SortMailOutcome> => {
  const resolved = resolveMailboxAccount("contacto");
  if (!resolved.ok) return { error: `Falta configurar el correo: ${resolved.missing.join(", ")}` };
  const account = resolved.account;
  const folder = WEB_FORM_MAIL_FOLDERS[kind];

  const client = new ImapFlow({
    ...account.imap,
    auth: account.auth,
    logger: false,
    emitLogs: false,
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: 30_000,
  });
  await client.connect();
  try {
    const target = findFolderPath(await client.list(), folder);
    if (!target) return { error: `No encontré la carpeta "${folder}" en contacto@` };

    const lock = await client.getMailboxLock("INBOX");
    try {
      // Los avisos los manda la web desde contacto@ a sí misma.
      const found = await client.search({ from: account.address }, { uid: true });
      const notices: MailNotice[] = [];
      if (found && found.length) {
        for await (const message of client.fetch(found, { envelope: true, internalDate: true }, { uid: true })) {
          notices.push({
            uid: message.uid,
            subject: message.envelope?.subject ?? "",
            replyTo: message.envelope?.replyTo?.[0]?.address ?? null,
            date: toDate(message.envelope?.date) ?? toDate(message.internalDate),
          });
        }
      }
      const emails = [...new Set(notices.flatMap((notice) => (notice.replyTo ? [notice.replyTo.toLowerCase()] : [])))];
      const submissions = emails.length
        ? await db.webFormSubmission.findMany({
            where: { email: { in: emails } },
            select: { email: true, createdAt: true, kind: true },
          })
        : [];
      const plan = planMailSort(notices, submissions, kind);
      if (plan.uids.length) await client.messageMove(plan.uids, target, { uid: true });

      const moved = plan.uids.length;
      const base = moved
        ? `${moved === 1 ? "1 aviso pasó" : `${moved} avisos pasaron`} a "${folder}"`
        : `No había avisos para mover a "${folder}"`;
      const note = plan.unmatched
        ? `. ${plan.unmatched === 1 ? "1 pedido sin formulario en el sistema quedó" : `${plan.unmatched} pedidos sin formulario en el sistema quedaron`} en la Bandeja de entrada`
        : "";
      return { success: `${base}${note}`, moved, unmatched: plan.unmatched };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
};
