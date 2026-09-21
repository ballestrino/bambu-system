"use client";

import type { ChatStatus } from "ai";
import { useEffect, useRef } from "react";

import { AgentMessage, hasVisibleContent } from "@/components/agent/agent-message";
import type { TurnNotice } from "@/components/agent/hooks/use-agent-session";
import type { AgentUIMessage } from "@/components/agent/types";

// Cerca del final se sigue el stream; si el usuario subió a leer, no se lo
// mueve.
const STICK_THRESHOLD_PX = 80;

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <span className="flex gap-1" aria-hidden>
        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-current" />
      </span>
      Pensando…
    </div>
  );
}

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
  const thinking =
    status === "submitted" || (status === "streaming" && last?.role === "assistant" && !hasVisibleContent(last));

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
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
    >
      {messages.length === 0 && !busy ? (
        emptyState
      ) : (
        <div className="space-y-5">
          {messages.map((message) => (
            <AgentMessage
              key={message.id}
              message={message}
              notice={notices[message.id]}
              onRetry={message === last && !busy ? onRetry : undefined}
            />
          ))}
          {thinking && <Thinking />}
        </div>
      )}
    </div>
  );
}
