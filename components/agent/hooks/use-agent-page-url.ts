"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent } from "react";

import type { AgentSession } from "@/components/agent/hooks/use-agent-session";
import { AGENT_PAGE_PARAM, getAgentPageUrl, readConversationParam } from "@/lib/agent/page-url";

// La dirección de la página y la conversación abierta, en los dos sentidos.
// Un cambio que llega de afuera (al entrar, el link del sidebar, una dirección
// pegada) abre esa conversación o arranca una nueva. Y la sesión se refleja
// con replaceState: sin ida al servidor ni remontar el chat, y sin entradas
// nuevas en el historial del navegador.
export const useAgentPageUrl = (session: AgentSession) => {
  const urlId = readConversationParam(useSearchParams().get(AGENT_PAGE_PARAM));

  // Si la dirección ya es la de la sesión (porque la escribió ella), no hay
  // nada que hacer.
  const followUrl = useEffectEvent((id: string | null) => {
    if (id) {
      if (id !== session.conversationId) void session.openConversation(id);
    } else if (session.conversationId === null || session.persisted) {
      session.startNew();
    }
  });
  useEffect(() => followUrl(urlId), [urlId]);

  // Solo una conversación lista: mientras abre, o si falló, la dirección queda
  // como está. Una nueva se refleja recién cuando se guardó (primer turno).
  const target =
    session.state.status === "ready" ? (session.persisted ? session.conversationId : null) : undefined;
  useEffect(() => {
    if (target === undefined) return;
    window.history.replaceState(null, "", getAgentPageUrl(target));
  }, [target]);
};
