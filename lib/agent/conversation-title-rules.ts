import {
  formatImageCount,
  getMessageImages,
  getMessageText,
  type AgentUIMessage,
} from "@/lib/agent/messages";

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

// De dónde sale el título provisorio: el texto del mensaje o, si solo trae
// imágenes, cuántas ("Imagen adjunta").
export const titleSourceText = (message: Pick<AgentUIMessage, "parts">) => {
  const text = getMessageText(message);
  if (text) return text;
  const images = getMessageImages(message).length;
  return images ? formatImageCount(images) : "";
};

// El título del modelo se genera mientras no haya respuesta (también al
// reintentar un primer turno que falló) y solo si el título sigue siendo el
// provisorio del primer mensaje: un renombrado del usuario nunca se pisa,
// aunque después regenere la primera respuesta. Un primer mensaje con solo
// imágenes se queda con "Imagen adjunta": el título se escribe con el texto.
export const needsModelTitle = (messages: AgentUIMessage[], currentTitle: string) => {
  if (messages.some((message) => message.role === "assistant")) return false;
  const first = messages.find((message) => message.role === "user");
  return (
    first !== undefined &&
    getMessageText(first) !== "" &&
    currentTitle === fallbackConversationTitle(titleSourceText(first))
  );
};
