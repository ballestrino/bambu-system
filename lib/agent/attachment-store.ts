import "server-only";

import { db } from "@/lib/db";

// Imágenes del composer. Se suben antes de enviar (messageId null), se
// vinculan al guardar el mensaje y se borran con él. Toda lectura filtra por
// userId: una conversación es de un usuario y sus imágenes también.

// Las que se subieron y nunca se enviaron (se quitaron del composer o se
// cerró la pestaña) se borran a las 24 horas, en la próxima subida.
const UNSENT_TTL_MS = 24 * 60 * 60 * 1000;

export const createAgentAttachment = async (input: {
  userId: string;
  mediaType: string;
  filename: string | null;
  width: number;
  height: number;
  data: Uint8Array<ArrayBuffer>;
}) => {
  await db.agentAttachment.deleteMany({
    where: {
      userId: input.userId,
      messageId: null,
      createdAt: { lt: new Date(Date.now() - UNSENT_TTL_MS) },
    },
  });
  return db.agentAttachment.create({
    data: { ...input, size: input.data.byteLength },
    select: { id: true, mediaType: true, filename: true },
  });
};

export const getOwnedAttachment = (id: string, userId: string) =>
  db.agentAttachment.findFirst({
    where: { id, userId },
    select: { mediaType: true, data: true },
  });

// Antes de tocar la conversación: cada imagen tiene que ser de quien envía y
// estar libre, o ya ser de este mensaje (un reintento). null = todo bien.
export const checkMessageAttachments = async (input: {
  userId: string;
  messageId: string;
  ids: string[];
}) => {
  if (!input.ids.length) return null;
  const rows = await db.agentAttachment.findMany({
    where: { id: { in: input.ids }, userId: input.userId },
    select: { messageId: true },
  });
  if (rows.length !== input.ids.length) return "Una imagen ya no está disponible: volvé a adjuntarla.";
  if (rows.some((row) => row.messageId !== null && row.messageId !== input.messageId)) {
    return "Una imagen ya se envió en otro mensaje: volvé a adjuntarla.";
  }
  return null;
};

// Con el mensaje ya guardado. En un reintento ya están vinculadas y no cambia
// nada.
export const linkMessageAttachments = async (input: {
  userId: string;
  messageId: string;
  ids: string[];
}) => {
  if (!input.ids.length) return;
  await db.agentAttachment.updateMany({
    where: { id: { in: input.ids }, userId: input.userId, messageId: null },
    data: { messageId: input.messageId },
  });
};

// Los bytes de las imágenes que va a ver el modelo.
export const loadAttachmentData = async (ids: string[], userId: string) => {
  if (!ids.length) return new Map<string, { mediaType: string; data: Uint8Array }>();
  const rows = await db.agentAttachment.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true, mediaType: true, data: true },
  });
  return new Map(rows.map((row) => [row.id, { mediaType: row.mediaType, data: row.data }]));
};
