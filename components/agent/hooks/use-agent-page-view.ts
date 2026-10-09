"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AGENT_PAGE_PARAM, readConversationParam } from "@/lib/agent/page-url";

export type AgentPageView = "list" | "chat";

// Qué se ve de la página cuando no hay lugar para la columna del historial
// (el teléfono, diseño 2b): el historial es la pantalla de inicio y una
// conversación se abre a pantalla completa. Se entra a la conversación si la
// dirección trae una. Con lugar, se ven las dos y esto no cambia nada.
//
// En <html> queda data-agent-view: en la app instalada, la conversación
// esconde los tabs (app/globals.css).
export const useAgentPageView = () => {
  const urlId = readConversationParam(useSearchParams().get(AGENT_PAGE_PARAM));
  const [view, setView] = useState<AgentPageView>(urlId ? "chat" : "list");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.agentView = view;
    return () => {
      delete root.dataset.agentView;
    };
  }, [view]);

  return { view, showList: () => setView("list"), showChat: () => setView("chat") };
};
