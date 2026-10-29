import "server-only";

import type { FetchMessageObject, MessageAddressObject, SearchObject } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";

import {
  formatEmailRef,
  resolveMailboxAccount,
  type EmailRef,
  type MailboxFolderId,
  type MailboxId,
} from "@/lib/mailbox/accounts";
import { withMailboxFolder } from "@/lib/mailbox/imap";
import { emailSnippet, prepareEmailText } from "@/lib/mailbox/text";

// Lecturas en vivo de las casillas de Hostinger, sin guardar nada en la base.
// Para la lista alcanza el principio del mensaje (el texto suele estar
// primero); para abrir uno se trae hasta 1 MB, que deja afuera adjuntos
// grandes pero no el texto.
const SNIPPET_SOURCE_BYTES = 24 * 1024;
const MESSAGE_SOURCE_BYTES = 1024 * 1024;

export type EmailAddress = { name: string | null; address: string | null };

const toAddress = (value?: MessageAddressObject): EmailAddress => ({
  name: value?.name?.trim() || null,
  address: value?.address?.toLowerCase() || null,
});

const flatten = (value?: AddressObject | AddressObject[]): EmailAddress[] =>
  (Array.isArray(value) ? value : value ? [value] : []).flatMap((group) =>
    group.value.map((item) => ({ name: item.name?.trim() || null, address: item.address?.toLowerCase() || null }))
  );

const toDate = (value: Date | string | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseSource = async (source?: Buffer) => {
  if (!source) return null;
  try {
    return await simpleParser(source, { skipImageLinks: true });
  } catch {
    return null;
  }
};

export type MailboxListInput = {
  mailboxes: MailboxId[];
  folder: MailboxFolderId;
  unreadOnly: boolean;
  days: number;
  search: string | null;
  limit: number;
};

const toSummary = async (mailbox: MailboxId, folder: MailboxFolderId, message: FetchMessageObject) => {
  const parsed = await parseSource(message.source);
  const envelope = message.envelope;
  return {
    ref: formatEmailRef({ mailbox, folder, uid: message.uid }),
    mailbox,
    from: toAddress(envelope?.from?.[0]),
    to: (envelope?.to ?? []).map(toAddress),
    subject: envelope?.subject?.trim() || "(Sin asunto)",
    date: toDate(envelope?.date) ?? toDate(message.internalDate),
    unread: !message.flags?.has("\\Seen"),
    answered: message.flags?.has("\\Answered") ?? false,
    snippet: emailSnippet(parsed?.text),
  };
};

export type MailboxEmailSummary = Awaited<ReturnType<typeof toSummary>>;

const listOne = async (mailbox: MailboxId, input: MailboxListInput) => {
  const resolved = resolveMailboxAccount(mailbox);
  if (!resolved.ok) return { mailbox, error: `Falta configurar ${resolved.missing.join(", ")}` } as const;
  try {
    return await withMailboxFolder(resolved.account, input.folder, async (client) => {
      const query: SearchObject = {
        since: new Date(Date.now() - input.days * 24 * 60 * 60 * 1000),
        ...(input.unreadOnly ? { seen: false } : {}),
        ...(input.search
          ? { or: [{ subject: input.search }, { from: input.search }, { body: input.search }] }
          : {}),
      };
      const uids = ((await client.search(query, { uid: true })) || []).sort((a, b) => a - b);
      const picked = uids.slice(-input.limit);
      const messages = picked.length
        ? await client.fetchAll(
            picked,
            { uid: true, flags: true, envelope: true, internalDate: true, source: { maxLength: SNIPPET_SOURCE_BYTES } },
            { uid: true }
          )
        : [];
      const emails = await Promise.all(messages.map((message) => toSummary(mailbox, input.folder, message)));
      return { mailbox, address: resolved.account.address, total: uids.length, emails } as const;
    });
  } catch (error) {
    console.error(`Mailbox ${mailbox} list failed:`, error);
    return { mailbox, error: "No pude conectarme a la casilla" } as const;
  }
};

// Las casillas pedidas, en paralelo y de la más nueva a la más vieja. Una que
// falla o no está configurada se informa sin frenar a la otra.
export const listMailboxEmails = async (input: MailboxListInput) => {
  const results = await Promise.all(input.mailboxes.map((mailbox) => listOne(mailbox, input)));
  const emails = results
    .flatMap((result) => ("emails" in result ? result.emails : []))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, input.limit);
  return {
    emails,
    total: results.reduce((sum, result) => sum + ("total" in result ? result.total : 0), 0),
    accounts: results.flatMap((result) => ("address" in result ? [{ mailbox: result.mailbox, address: result.address }] : [])),
    unavailable: results.flatMap((result) => ("error" in result ? [{ mailbox: result.mailbox, reason: result.error }] : [])),
  };
};

const toEmail = async (ref: EmailRef, mailboxAddress: string, message: FetchMessageObject) => {
  const parsed = await parseSource(message.source);
  const text = prepareEmailText(parsed?.text);
  return {
    ref: formatEmailRef(ref),
    mailbox: ref.mailbox,
    mailboxAddress,
    from: flatten(parsed?.from)[0] ?? toAddress(message.envelope?.from?.[0]),
    replyTo: flatten(parsed?.replyTo)[0] ?? null,
    to: parsed ? flatten(parsed.to) : (message.envelope?.to ?? []).map(toAddress),
    cc: flatten(parsed?.cc),
    subject: (parsed?.subject ?? message.envelope?.subject)?.trim() || "(Sin asunto)",
    date: parsed?.date ?? toDate(message.envelope?.date) ?? toDate(message.internalDate),
    unread: !message.flags?.has("\\Seen"),
    answered: message.flags?.has("\\Answered") ?? false,
    body: text.body || "(Correo sin texto)",
    bodyTruncated: text.truncated,
    quoted: text.quoted,
    attachments: (parsed?.attachments ?? []).map((item) => item.filename || item.contentType),
  };
};

export type MailboxEmail = Awaited<ReturnType<typeof toEmail>>;

const NOT_FOUND = "No encontré ese correo: puede haberse movido o borrado";

// Varios correos con una conexión por casilla y carpeta, en el orden pedido.
// Los que ya no están y los de una casilla sin configurar vuelven en missing.
export const readMailboxEmails = async (refs: EmailRef[]) => {
  const groups = new Map<string, EmailRef[]>();
  refs.forEach((ref) => {
    const key = `${ref.mailbox}/${ref.folder}`;
    groups.set(key, [...(groups.get(key) ?? []), ref]);
  });
  const emails: MailboxEmail[] = [];
  const missing: { ref: string; reason: string }[] = [];
  await Promise.all(
    [...groups.values()].map(async (group) => {
      const resolved = resolveMailboxAccount(group[0].mailbox);
      if (!resolved.ok) {
        const reason = `Falta configurar ${resolved.missing.join(", ")}`;
        group.forEach((ref) => missing.push({ ref: formatEmailRef(ref), reason }));
        return;
      }
      const messages = await withMailboxFolder(resolved.account, group[0].folder, (client) =>
        client.fetchAll(
          group.map((ref) => ref.uid),
          { uid: true, flags: true, envelope: true, internalDate: true, source: { maxLength: MESSAGE_SOURCE_BYTES } },
          { uid: true }
        )
      );
      const byUid = new Map(messages.map((message) => [message.uid, message]));
      for (const ref of group) {
        const message = byUid.get(ref.uid);
        if (message) emails.push(await toEmail(ref, resolved.account.address, message));
        else missing.push({ ref: formatEmailRef(ref), reason: NOT_FOUND });
      }
    })
  );
  const order = refs.map(formatEmailRef);
  emails.sort((a, b) => order.indexOf(a.ref) - order.indexOf(b.ref));
  return { emails, missing };
};

export const readMailboxEmail = async (ref: EmailRef) => {
  const { emails, missing } = await readMailboxEmails([ref]);
  return emails[0]
    ? ({ ok: true, email: emails[0] } as const)
    : ({ ok: false, error: missing[0]?.reason ?? NOT_FOUND } as const);
};
