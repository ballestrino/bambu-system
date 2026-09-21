"use client";

import type { Chat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { generateId } from "ai";
import { useEffect, useRef, useState } from "react";

import { createAgentChat } from "@/components/agent/agent-transport";
import { useAgentConversationMutations } from "@/components/agent/hooks/use-agent-conversation-mutations";
import { useAgentConversations, useAgentSettings } from "@/components/agent/hooks/use-agent-queries";
import { conversationListQuery, conversationQuery, refreshAfterTurn } from "@/components/agent/queries";
import type { AgentUIMessage } from "@/components/agent/types";
import { DEFAULT_AGENT_SKILL, type AgentSkillId } from "@/lib/agent/skills";
import { DEFAULT_AGENT_MODE, type AgentMode } from "@/lib/ai/modes";

export type TurnNotice = "stopped" | "interrupted";

type SessionState =
  | { status: "idle" }
  | { status: "loading"; id: string | null }
  | { status: "error"; id: string; message: string }
  | {
      status: "ready";
      id: string;
      chat: Chat<AgentUIMessage>;
      savedMode: AgentMode | null;
      savedTitle: string | null;
    };

// La sesión del Sheet: qué conversación está abierta, su instancia Chat y el
// modo. Vive en el host, así cerrar el Sheet no la pierde.
export const useAgentSession = ({ budgetId }: { budgetId: string | null }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: "idle" });
  const [modeOverride, setModeOverride] = useState<AgentMode | null>(null);
  const [notices, setNotices] = useState<Record<string, TurnNotice>>({});
  // La habilidad elegida sigue marcada al cerrar el Sheet o cambiar de
  // conversación.
  const [skill, setSkill] = useState<AgentSkillId>(DEFAULT_AGENT_SKILL);
  // Cada cambio de conversación invalida las lecturas que seguían en curso.
  const requestRef = useRef(0);
  const started = state.status !== "idle";
  const settings = useAgentSettings(started);
  const conversations = useAgentConversations(budgetId, started);
  const { setMode } = useAgentConversationMutations();

  const chat = state.status === "ready" ? state.chat : null;
  // Cambiar de conversación o salir de la página corta el stream anterior.
  useEffect(() => () => void chat?.stop(), [chat]);

  const createChat = (id: string, messages: AgentUIMessage[]) =>
    createAgentChat({
      id,
      messages,
      onFinish: ({ message, isAbort, isError }) => {
        // Sin línea de uso, sin error y sin Stop: el stream se cortó antes del
        // final (por ejemplo, el tope de duración de la función).
        const notice: TurnNotice | null = isAbort
          ? "stopped"
          : !isError && message.role === "assistant" && !message.metadata?.usage
            ? "interrupted"
            : null;
        if (notice) setNotices((current) => ({ ...current, [message.id]: notice }));
        refreshAfterTurn(queryClient, id);
      },
    });

  const begin = (next: SessionState) => {
    requestRef.current += 1;
    setModeOverride(null);
    setNotices({});
    setState(next);
    return requestRef.current;
  };

  const startNew = () => {
    const id = generateId();
    begin({ status: "ready", id, chat: createChat(id, []), savedMode: null, savedTitle: null });
  };

  const openConversation = async (id: string) => {
    const request = begin({ status: "loading", id });
    try {
      const data = await queryClient.fetchQuery(conversationQuery(id));
      if (request !== requestRef.current) return;
      setState({
        status: "ready",
        id,
        chat: createChat(id, data.messages),
        savedMode: data.conversation.mode,
        savedTitle: data.conversation.title,
      });
    } catch (error) {
      if (request !== requestRef.current) return;
      const message = error instanceof Error ? error.message : "No se pudo abrir la conversación.";
      setState({ status: "error", id, message });
    }
  };

  // La primera vez que se abre el Sheet: en un presupuesto guardado se retoma
  // su última conversación; en crear (sin presupuesto) se arranca una nueva.
  const ensureStarted = async () => {
    if (started) return;
    if (!budgetId) return startNew();
    const request = begin({ status: "loading", id: null });
    const latest = await queryClient
      .fetchQuery(conversationListQuery(budgetId))
      .then((list) => list[0]?.id ?? null, () => null);
    if (request !== requestRef.current) return;
    if (latest) await openConversation(latest);
    else startNew();
  };

  const id = state.status === "idle" ? null : state.id;
  const current = id ? conversations.data?.find((item) => item.id === id) : undefined;
  const mode =
    modeOverride ??
    (state.status === "ready" ? state.savedMode : null) ??
    settings.data?.defaultMode ??
    DEFAULT_AGENT_MODE;

  // El modo aplica a los turnos siguientes. Si la conversación ya existe en
  // la base se guarda ya; si no, viaja con el primer mensaje.
  const changeMode = (next: AgentMode) => {
    setModeOverride(next);
    if (id && current) setMode.mutate({ id, mode: next });
  };

  const onConversationDeleted = (deletedId: string) => {
    if (deletedId === id) startNew();
  };

  return {
    state,
    chat,
    conversationId: id,
    persisted: Boolean(current),
    title: current?.title ?? (state.status === "ready" ? state.savedTitle : null),
    mode,
    modes: settings.data?.modes ?? null,
    skill,
    setSkill,
    notices,
    changeMode,
    startNew,
    openConversation,
    ensureStarted,
    onConversationDeleted,
  };
};

export type AgentSession = ReturnType<typeof useAgentSession>;
