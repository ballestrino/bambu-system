import { parseAgentAttachmentId } from "@/lib/agent/attachment-rules";
import type { AgentUIMessage } from "@/lib/agent/messages";
import type { AgentSkillId } from "@/lib/agent/skills/types";
import type { AgentMode } from "@/lib/ai/modes";
import type { AgentBudgetContextInput } from "@/schemas/agent";

// El pedido del Sheet a /api/agent/chat y cómo se lee un error. Puro: lo usan
// el transport del cliente y el check, que valida el cuerpo contra el schema
// de la ruta.
export const AGENT_CHAT_API = "/api/agent/chat";

// Lo que viaja con cada envío además del mensaje. Se pasa en cada
// sendMessage o regenerate, así el formulario se lee al enviar.
export type AgentRequestOptions = {
  mode: AgentMode;
  skill: AgentSkillId;
  context?: AgentBudgetContextInput;
};

// Las partes que viajan: el texto (sin los vacíos de un mensaje con solo
// imágenes) y las imágenes ya subidas, por su dirección.
type RequestPart =
  | { type: "text"; text: string }
  | { type: "file"; mediaType: string; url: string; filename?: string };

const toRequestParts = (parts: AgentUIMessage["parts"]) =>
  parts.flatMap<RequestPart>((part) => {
    if (part.type === "text") return part.text.trim() ? [{ type: "text" as const, text: part.text }] : [];
    if (part.type !== "file" || parseAgentAttachmentId(part.url) === null) return [];
    return [
      {
        type: "file" as const,
        mediaType: part.mediaType,
        url: part.url,
        ...(part.filename ? { filename: part.filename } : {}),
      },
    ];
  });

// Solo el último mensaje del usuario: el historial lo lee el servidor de la
// base, así nadie lo puede reescribir desde el navegador.
export const buildAgentChatBody = (input: {
  id: string;
  messages: AgentUIMessage[];
  trigger: "submit-message" | "regenerate-message";
  messageId: string | undefined;
  options: Partial<AgentRequestOptions> | undefined;
}) => {
  const message = input.messages.at(-1);
  if (!message || message.role !== "user") throw new Error("No hay un mensaje para enviar.");
  const { mode, skill, context } = input.options ?? {};
  return {
    id: input.id,
    message: {
      id: message.id,
      role: "user" as const,
      parts: toRequestParts(message.parts),
    },
    mode,
    skill,
    context,
    trigger: input.trigger,
    messageId: input.messageId,
  };
};

export const SESSION_EXPIRED_MESSAGE = "Tu sesión venció: volvé a iniciar sesión.";
const GENERIC_ERROR = "El asistente no pudo responder. Probá de nuevo en un momento.";
const NETWORK_ERROR = "No se pudo conectar con el asistente. Revisá la conexión y probá de nuevo.";
const TIMEOUT_ERROR = "El asistente tardó demasiado y se cortó. Probá de nuevo o con un modo más rápido.";

const readJsonError = (text: string) => {
  try {
    const parsed: unknown = JSON.parse(text);
    const error = (parsed as { error?: unknown } | null)?.error;
    return typeof error === "string" && error ? error : null;
  } catch {
    return null;
  }
};

// Qué ve el usuario cuando falla un turno. La ruta responde { error } en JSON
// y el stream manda textos en español (toAgentErrorMessage): esos se muestran
// tal cual. El resto (el HTML de un 504, errores del SDK en inglés) se cambia
// por un mensaje genérico.
export const readAgentError = (error: Error | null | undefined) => {
  if (!error) return null;
  if ("statusCode" in error) {
    return readJsonError(error.message) ?? (error.statusCode === 504 ? TIMEOUT_ERROR : GENERIC_ERROR);
  }
  if (error.name === "TypeError") return NETWORK_ERROR;
  if (error.name === "Error" && error.message.trim()) return error.message;
  return GENERIC_ERROR;
};
