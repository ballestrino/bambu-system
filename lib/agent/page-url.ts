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

type PageSession = {
  state: { status: "idle" | "loading" | "ready" | "error" };
  conversationId: string | null;
  persisted: boolean;
};

// La dirección llega sin id (al entrar, el link del sidebar, atrás): se
// arranca una nueva, salvo que la sesión ya sea una nueva lista y sin guardar,
// que puede estar en su primer turno. Desde el error o mientras abre otra,
// también se arranca una nueva.
export const startsNewWithoutUrlId = (session: PageSession) =>
  session.state.status !== "ready" || session.persisted;

// La dirección que refleja la sesión: la conversación lista, o la que no se
// pudo abrir (recargar muestra el mismo error). null es la página sin
// conversación (una nueva todavía sin guardar), y undefined deja la dirección
// como está mientras abre.
export const pageUrlTarget = (session: PageSession) => {
  if (session.state.status === "ready") return session.persisted ? session.conversationId : null;
  if (session.state.status === "error") return session.conversationId;
  return undefined;
};
