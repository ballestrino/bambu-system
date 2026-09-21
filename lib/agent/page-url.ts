import { isAgentClientId } from "@/lib/agent/client-id";

// La página del agente. La conversación abierta, si ya está guardada, va en
// ?conversacion=: recargar o compartir el link la vuelve a abrir.
export const AGENT_PAGE_PATH = "/dashboard/agent";
export const AGENT_PAGE_PARAM = "conversacion";

export const getAgentPageUrl = (conversationId: string | null) =>
  conversationId
    ? `${AGENT_PAGE_PATH}?${AGENT_PAGE_PARAM}=${encodeURIComponent(conversationId)}`
    : AGENT_PAGE_PATH;

// Un valor que no puede ser un id se ignora: la página arranca una nueva.
export const readConversationParam = (value: string | null | undefined) =>
  isAgentClientId(value) ? value : null;
