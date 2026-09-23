import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatOnFinishCallback } from "ai";

import {
  AGENT_CHAT_API,
  buildAgentChatBody,
  SESSION_EXPIRED_MESSAGE,
  type AgentRequestOptions,
} from "@/lib/agent/chat-request";
import type { AgentUIMessage } from "@/lib/agent/messages";

// Con la sesión vencida, proxy.ts redirige /api/* al login y fetch sigue la
// redirección: llegaría el HTML del login en vez del stream.
const agentFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.redirected) throw new Error(SESSION_EXPIRED_MESSAGE);
  return response;
};

// Uno solo para todas las conversaciones. Lo que cambia en cada envío (modo,
// habilidad y contexto) llega en el body de sendMessage o regenerate.
export const agentChatTransport = new DefaultChatTransport<AgentUIMessage>({
  api: AGENT_CHAT_API,
  fetch: agentFetch,
  prepareSendMessagesRequest: ({ id, messages, body, trigger, messageId }) => ({
    body: buildAgentChatBody({
      id,
      messages,
      trigger,
      messageId,
      options: body as Partial<AgentRequestOptions> | undefined,
    }),
  }),
});

// La conversación en el navegador. Vive en el host del Sheet, no en su
// contenido: cerrar y reabrir el Sheet no corta el stream ni pierde mensajes.
export const createAgentChat = (input: {
  id: string;
  messages: AgentUIMessage[];
  onFinish: ChatOnFinishCallback<AgentUIMessage>;
}) =>
  new Chat<AgentUIMessage>({
    id: input.id,
    messages: input.messages,
    transport: agentChatTransport,
    onFinish: input.onFinish,
  });
