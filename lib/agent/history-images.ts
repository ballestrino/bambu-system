import { parseAgentAttachmentId } from "@/lib/agent/attachment-rules";
import type { AgentUIMessage } from "@/lib/agent/messages";

// Qué imágenes del historial ve el modelo. Puro: lo prueba el check; los
// bytes los pone model-attachments.ts.

// Las 14 más recientes (dos mensajes llenos): con gpt-6 son unos 32.000 tokens
// como mucho, y una conversación larga con muchas capturas no reenvía todas en
// cada turno. Las anteriores quedan como un aviso de texto.
export const MAX_HISTORY_IMAGES = 14;

export const OLDER_IMAGE_TEXT = "[Imagen de un mensaje anterior: ya no se adjunta]";
export const MISSING_IMAGE_TEXT = "[Imagen que ya no está disponible]";

// Los ids a mandar, de la más nueva a la más vieja.
export const selectHistoryImageIds = (messages: AgentUIMessage[], max = MAX_HISTORY_IMAGES) => {
  const ids: string[] = [];
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") continue;
    for (const part of [...message.parts].reverse()) {
      const id = part.type === "file" ? parseAgentAttachmentId(part.url) : null;
      if (id && !ids.includes(id) && ids.length < max) ids.push(id);
    }
  }
  return ids;
};

type ImageData = { mediaType: string; data: Uint8Array };

const toDataUrl = ({ mediaType, data }: ImageData) =>
  `data:${mediaType};base64,${Buffer.from(data).toString("base64")}`;

// Cambia la dirección de cada imagen elegida por su data URL: el modelo no
// puede leer /api/agent/attachments, que pide sesión. Una vieja o borrada
// pasa a ser texto, así el modelo sabe que hubo una imagen.
export const withInlineImages = (
  messages: AgentUIMessage[],
  selected: string[],
  images: ReadonlyMap<string, ImageData>
): AgentUIMessage[] =>
  messages.map((message) => {
    if (message.role !== "user" || !message.parts.some((part) => part.type === "file")) return message;
    return {
      ...message,
      parts: message.parts.map((part) => {
        if (part.type !== "file") return part;
        const id = parseAgentAttachmentId(part.url);
        if (!id || !selected.includes(id)) return { type: "text" as const, text: OLDER_IMAGE_TEXT };
        const image = images.get(id);
        if (!image) return { type: "text" as const, text: MISSING_IMAGE_TEXT };
        return { ...part, url: toDataUrl(image) };
      }),
    };
  });
