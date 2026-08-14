import { db } from "@/lib/db";
import { MAIL_ATTACHMENT_LIMIT_BYTES } from "@/lib/mail-agent/config";
import {
  createMailImapClient,
  resolveSyncFolders,
} from "@/lib/mail-agent/imap-client";

export const downloadMailAttachment = async (id: string) => {
  const attachment = await db.mailAttachment.findUniqueOrThrow({
    where: { id },
    include: { message: true },
  });
  if (
    !attachment.providerPartId ||
    attachment.message.uidValidity === "local" ||
    attachment.sizeBytes > MAIL_ATTACHMENT_LIMIT_BYTES
  ) {
    throw new Error("Este adjunto debe abrirse desde Hostinger");
  }
  const client = createMailImapClient();
  try {
    await client.connect();
    const folders = resolveSyncFolders(await client.list());
    const path = folders.find(({ key }) => key === attachment.message.folderKey)?.path;
    if (!path) throw new Error("La carpeta del adjunto ya no está disponible");
    const lock = await client.getMailboxLock(path);
    try {
      const download = await client.download(
        Number(attachment.message.providerUid),
        attachment.providerPartId,
        { uid: true, maxBytes: MAIL_ATTACHMENT_LIMIT_BYTES + 1 }
      );
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of download.content) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAIL_ATTACHMENT_LIMIT_BYTES) {
          throw new Error("El adjunto supera el límite de 4 MB");
        }
        chunks.push(buffer);
      }
      return {
        content: Buffer.concat(chunks),
        filename: attachment.filename,
        mimeType: attachment.mimeType,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
};
