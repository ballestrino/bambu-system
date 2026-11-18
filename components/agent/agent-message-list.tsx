"use client";

import type { ChatStatus } from "ai";
import { useEffect, useRef } from "react";

import { AgentMessage, hasVisibleContent } from "@/components/agent/agent-message";
import { AgentThinking } from "@/components/agent/agent-thinking";
import { getFinishedToolKinds, getThinkingPhrases } from "@/components/agent/agent-thinking-phrases";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";

// Cerca del final se sigue el stream; si el usuario subió a leer, no se lo
// mueve.
const STICK_THRESHOLD_PX = 80;

export function AgentMessageList({
  messages,
  status,
  notices,
  emptyState,
  onRetry,
}: {
  messages: AgentUIMessage[];
  status: ChatStatus;
  notices: Record<string, TurnNotice>;
  emptyState: React.ReactNode;
  onRetry?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const last = messages.at(-1);
  const busy = status === "submitted" || status === "streaming";
  const pendingReply = last?.role === "assistant" && busy && !hasVisibleContent(last) ? last : undefined;
  const thinking = status === "submitted" || pendingReply !== undefined;
  // Con las tools de la respuesta ya terminadas, el indicador sigue debajo.
  const afterTools =
    status === "streaming" && !thinking && last?.role === "assistant" ? getFinishedToolKinds(last) : null;
  const skill = messages.findLast((message) => message.role === "user")?.metadata?.skill;

  useEffect(() => {
    const element = scrollRef.current;
    // Un mensaje nuevo del usuario siempre baja hasta el final.
    if (element && (stickRef.current || last?.role === "user")) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, status, last]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_THRESHOLD_PX;
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      role="log"
      aria-busy={busy}
      aria-label="Conversación con el asistente"
      className="@container/thread min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 @2xl/chat:px-8"
    >
      {messages.length === 0 && !busy ? (
        emptyState
      ) : (
        // En la página la columna es ancha: los mensajes quedan en un ancho de
        // lectura, el mismo del composer (en el Sheet no cambia nada).
        <div className="mx-auto max-w-[720px] space-y-6">
          {/* La respuesta vacía no se dibuja: el indicador va con el bambú. */}
          {messages.map((message) =>
            message === pendingReply ? null : (
              <AgentMessage
                key={message.id}
                message={message}
                notice={notices[message.id]}
                onRetry={message === last && !busy ? onRetry : undefined}
                pending={
                  message === last && afterTools ? (
                    <AgentThinking key="after-tools" phrases={getThinkingPhrases("afterTools", skill, afterTools)} />
                  ) : undefined
                }
              />
            )
          )}
          {thinking && <AgentThinking key="start" withBamboo phrases={getThinkingPhrases("start", skill, [])} />}
        </div>
      )}
    </div>
  );
}
