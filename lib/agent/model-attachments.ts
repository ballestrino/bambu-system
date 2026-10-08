import "server-only";

import { loadAttachmentData } from "@/lib/agent/attachment-store";
import { selectHistoryImageIds, withInlineImages } from "@/lib/agent/history-images";
import type { AgentUIMessage } from "@/lib/agent/messages";

// El historial que se convierte para el modelo, con las imágenes recientes
// como data URL. La base y el stream conservan las direcciones.
export const inlineHistoryImages = async (messages: AgentUIMessage[], userId: string) => {
  const selected = selectHistoryImageIds(messages);
  if (!selected.length && !messages.some((message) => message.parts.some((part) => part.type === "file"))) {
    return messages;
  }
  return withInlineImages(messages, selected, await loadAttachmentData(selected, userId));
};
