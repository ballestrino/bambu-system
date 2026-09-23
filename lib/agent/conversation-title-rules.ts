import { getMessageText, type AgentUIMessage } from "@/lib/agent/messages";

// Reglas del título de una conversación. Puro: lo prueba check:agent-tools.
export const TITLE_MAX_LENGTH = 60;

// Título determinista con el primer mensaje: la conversación nunca queda sin
// nombre, aunque el modelo falle o no haya clave.
export const fallbackConversationTitle = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Nueva conversación";
  return clean.length > TITLE_MAX_LENGTH
    ? `${clean.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`
    : clean;
};

// El título del modelo se genera mientras no haya respuesta (también al
// reintentar un primer turno que falló) y solo si el título sigue siendo el
// provisorio del primer mensaje: un renombrado del usuario nunca se pisa,
// aunque después regenere la primera respuesta.
export const needsModelTitle = (messages: AgentUIMessage[], currentTitle: string) => {
  if (messages.some((message) => message.role === "assistant")) return false;
  const first = messages.find((message) => message.role === "user");
  return first !== undefined && currentTitle === fallbackConversationTitle(getMessageText(first));
};
