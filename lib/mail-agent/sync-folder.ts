import type { FetchMessageObject, ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import { db } from "@/lib/db";
import {
  MAIL_ATTACHMENT_LIMIT_BYTES,
  MAIL_SYNC_BATCH_SIZE,
} from "@/lib/mail-agent/config";
import type { SyncFolder } from "@/lib/mail-agent/imap-client";
import {
  extractStructureAttachments,
  getParsedMailAddresses,
  getReferenceIds,
} from "@/lib/mail-agent/mime";
import {
  cancelQueuedThreadReplies,
  persistSyncedMail,
  type PersistedMailInput,
} from "@/lib/mail-agent/persist-message";
import { getSyncedMailDirection } from "@/lib/mail-agent/sync-direction";

const headerText = (value: unknown) =>
  typeof value === "string" ? value : value ? String(value) : null;

const buildLargeMessage = (
  message: FetchMessageObject,
  folder: SyncFolder,
  uidValidity: string,
  mailboxAddress: string
): PersistedMailInput => {
  const envelope = message.envelope;
  const from = envelope?.from?.[0];
  const fromAddress = from?.address?.toLowerCase() ?? "unknown@invalid.local";
  const direction = getSyncedMailDirection(folder.key, fromAddress, mailboxAddress);
  return {
    folderKey: folder.key,
    uidValidity,
    providerUid: String(message.uid),
    internetMessageId: envelope?.messageId,
    inReplyTo: envelope?.inReplyTo,
    referenceIds: [],
    direction,
    fromAddress,
    fromName: from?.name,
    toAddresses: envelope?.to?.flatMap(({ address }) => (address ? [address.toLowerCase()] : [])) ?? [],
    ccAddresses: envelope?.cc?.flatMap(({ address }) => (address ? [address.toLowerCase()] : [])) ?? [],
    bccAddresses: envelope?.bcc?.flatMap(({ address }) => (address ? [address.toLowerCase()] : [])) ?? [],
    subject: envelope?.subject || "(Sin asunto)",
    bodyText: "Este mensaje supera el límite local. Abrilo en Hostinger para ver el contenido completo.",
    messageAt: new Date(envelope?.date ?? message.internalDate ?? Date.now()),
    isRead: message.flags?.has("\\Seen") ?? false,
    isArchived: folder.archived,
    hasAttachments: extractStructureAttachments(message.bodyStructure).length > 0,
    requiresHandoff: true,
    attachments: extractStructureAttachments(message.bodyStructure),
  };
};

const buildParsedMessage = async (
  message: FetchMessageObject,
  folder: SyncFolder,
  uidValidity: string,
  mailboxAddress: string
): Promise<PersistedMailInput> => {
  if (!message.source) return buildLargeMessage(message, folder, uidValidity, mailboxAddress);
  const parsed = await simpleParser(message.source, { skipImageLinks: true });
  const addresses = getParsedMailAddresses(parsed);
  const direction = getSyncedMailDirection(
    folder.key,
    addresses.fromAddress,
    mailboxAddress
  );
  const structuredAttachments = extractStructureAttachments(message.bodyStructure);
  const attachments = structuredAttachments.length
    ? structuredAttachments
    : parsed.attachments.map((attachment) => ({
        filename: attachment.filename || "adjunto",
        mimeType: attachment.contentType,
        sizeBytes: attachment.size,
        contentId: attachment.contentId,
      }));
  return {
    folderKey: folder.key,
    uidValidity,
    providerUid: String(message.uid),
    internetMessageId: parsed.messageId,
    inReplyTo: parsed.inReplyTo,
    referenceIds: getReferenceIds(parsed),
    direction,
    ...addresses,
    subject: parsed.subject || "(Sin asunto)",
    bodyText: parsed.text?.trim() || "(Mensaje sin contenido de texto)",
    bodyHtml: typeof parsed.html === "string" ? parsed.html : null,
    messageAt: new Date(parsed.date ?? message.internalDate ?? Date.now()),
    isRead: message.flags?.has("\\Seen") ?? false,
    isArchived: folder.archived,
    hasAttachments: attachments.length > 0,
    requiresHandoff: false,
    autoSubmitted: headerText(parsed.headers.get("auto-submitted")),
    listId: headerText(parsed.headers.get("list-id")),
    headers: {
      replyTo: parsed.replyTo?.text ?? null,
      priority: parsed.priority ?? null,
    },
    attachments,
  };
};

const loadMessages = async (client: ImapFlow, uids: number[]) => {
  const metadata = await client.fetchAll(
    uids,
    { uid: true, flags: true, envelope: true, internalDate: true, size: true, bodyStructure: true },
    { uid: true }
  );
  const smallUids = metadata
    .filter(({ size }) => (size ?? 0) <= MAIL_ATTACHMENT_LIMIT_BYTES)
    .map(({ uid }) => uid);
  const sources = smallUids.length
    ? await client.fetchAll(smallUids, { uid: true, source: true }, { uid: true })
    : [];
  const sourceByUid = new Map(sources.map((item) => [item.uid, item.source]));
  return metadata.map((item) => ({ ...item, source: sourceByUid.get(item.uid) }));
};

export const syncMailFolder = async (
  client: ImapFlow,
  folder: SyncFolder,
  importSince: Date,
  mailboxAddress: string
) => {
  const lock = await client.getMailboxLock(folder.path);
  try {
    const uidValidity = String(client.mailbox && client.mailbox.uidValidity);
    let cursor = await db.mailFolderCursor.upsert({
      where: { folderKey: folder.key },
      create: { folderKey: folder.key, displayName: folder.path, uidValidity },
      update: { displayName: folder.path },
    });
    if (cursor.uidValidity !== uidValidity) {
      cursor = await db.mailFolderCursor.update({
        where: { id: cursor.id },
        data: { uidValidity, lastUid: null, initialImportComplete: false },
      });
    }
    const query = cursor.lastUid
      ? { uid: `${Number(cursor.lastUid) + 1}:*` }
      : { since: importSince };
    const searched = await client.search(query, { uid: true });
    const candidates = (searched || []).sort((left, right) => left - right);
    const selected = candidates.slice(0, MAIL_SYNC_BATCH_SIZE);
    const messages = selected.length ? await loadMessages(client, selected) : [];
    const inboundIds: string[] = [];
    let imported = 0;
    let skipped = 0;
    for (const message of messages) {
      try {
        const input = await buildParsedMessage(message, folder, uidValidity, mailboxAddress);
        const persisted = await persistSyncedMail(input);
        if (persisted.created) imported += 1;
        else skipped += 1;
        if (persisted.created && input.direction === "INBOUND") {
          await cancelQueuedThreadReplies(persisted.threadId);
          inboundIds.push(persisted.id);
        }
      } catch {
        skipped += 1;
      }
    }
    const complete = candidates.length <= MAIL_SYNC_BATCH_SIZE;
    await db.mailFolderCursor.update({
      where: { id: cursor.id },
      data: {
        lastUid: selected.length ? String(selected.at(-1)) : cursor.lastUid,
        initialImportComplete: cursor.initialImportComplete || complete,
        lastSyncedAt: new Date(),
      },
    });
    return { imported, skipped, inboundIds, complete };
  } finally {
    lock.release();
  }
};
