"use client";

import { useChat, type Chat } from "@ai-sdk/react";
import type { FileUIPart } from "ai";

import type { AgentUIMessage } from "@/components/agent/types";
import type { AgentRequestOptions } from "@/lib/agent/chat-request";
import { DEFAULT_AGENT_SKILL, type AgentSkillId } from "@/lib/agent/skills";
import type { AgentMode } from "@/lib/ai/modes";
import type { AgentBudgetContextInput } from "@/schemas/agent";

const STREAM_THROTTLE_MS = 50;

// La vista de una conversación sobre su instancia Chat (que vive en el host).
// El modo y el contexto se leen al enviar: el formulario cambia en cada tecla.
export const useAgentChat = ({
  chat,
  mode,
  getContext,
}: {
  chat: Chat<AgentUIMessage>;
  mode: AgentMode;
  getContext: () => AgentBudgetContextInput | undefined;
}) => {
  // Un render cada 50 ms como mucho: con varias tarjetas en pantalla, uno por
  // token se nota.
  const { messages, status, error, sendMessage, regenerate, stop, clearError } =
    useChat<AgentUIMessage>({ chat, throttle: STREAM_THROTTLE_MS });
  const busy = status === "submitted" || status === "streaming";

  const requestOptions = (skill: AgentSkillId): AgentRequestOptions => ({
    mode,
    skill,
    context: getContext(),
  });

  // Texto, imágenes ya subidas o las dos cosas. Sin texto no va una parte de
  // texto vacía.
  const send = (text: string, skill: AgentSkillId, files: FileUIPart[] = []) => {
    const trimmed = text.trim();
    if ((!trimmed && !files.length) || busy) return false;
    const metadata = { mode, skill, createdAt: new Date().toISOString() };
    void sendMessage(
      trimmed ? { text: trimmed, files, metadata } : { files, metadata },
      { body: requestOptions(skill) }
    );
    return true;
  };

  const lastUserMessage = messages.findLast((message) => message.role === "user");

  // Reintentar repite el último pedido con su habilidad y el modo actual: si
  // falló o se cortó, se puede probar con otro modo.
  const retry = () => {
    if (!lastUserMessage || busy) return;
    void regenerate({ body: requestOptions(lastUserMessage.metadata?.skill ?? DEFAULT_AGENT_SKILL) });
  };

  return {
    messages,
    status,
    error,
    busy,
    canRetry: Boolean(lastUserMessage) && !busy,
    send,
    retry,
    stop: () => void stop(),
    clearError,
  };
};
