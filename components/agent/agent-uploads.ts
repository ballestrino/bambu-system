import type { FileUIPart } from "ai";

import { AGENT_ATTACHMENTS_API } from "@/lib/agent/attachment-rules";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/agent/chat-request";
import type { CompressedImage } from "@/lib/agent/image-compress";
import type { AgentMode } from "@/lib/ai/modes";

// Las subidas del composer: una imagen o un dictado por pedido. Como en el
// transport, una redirección es la sesión vencida (proxy.ts manda al login).
export const AGENT_TRANSCRIBE_API = "/api/agent/transcribe";

const postForm = async (url: string, form: FormData, fallback: string) => {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form });
  } catch {
    throw new Error("No se pudo conectar. Revisá la conexión y probá de nuevo.");
  }
  if (response.redirected) throw new Error(SESSION_EXPIRED_MESSAGE);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: unknown } | null)?.error;
    throw new Error(typeof error === "string" && error ? error : fallback);
  }
  return body;
};

// La imagen ya achicada. Devuelve la parte que viaja en el mensaje.
export const uploadAgentImage = async (image: CompressedImage, filename: string): Promise<FileUIPart> => {
  const form = new FormData();
  form.append("image", image.blob, "imagen.jpg");
  form.append("width", String(image.width));
  form.append("height", String(image.height));
  if (filename) form.append("filename", filename.slice(0, 200));
  const body = (await postForm(AGENT_ATTACHMENTS_API, form, "No se pudo subir la imagen.")) as {
    url: string;
    mediaType: string;
    filename: string | null;
  };
  return {
    type: "file",
    mediaType: body.mediaType,
    url: body.url,
    ...(body.filename ? { filename: body.filename } : {}),
  };
};

export const transcribeRecording = async (input: {
  audio: Blob;
  durationSeconds: number;
  mode: AgentMode;
  conversationId: string;
}) => {
  const form = new FormData();
  form.append("audio", input.audio, "dictado");
  form.append("durationSeconds", String(Math.round(input.durationSeconds * 10) / 10));
  form.append("mode", input.mode);
  form.append("conversationId", input.conversationId);
  const body = (await postForm(AGENT_TRANSCRIBE_API, form, "No se pudo transcribir el audio.")) as {
    text: string;
  };
  return body.text;
};
