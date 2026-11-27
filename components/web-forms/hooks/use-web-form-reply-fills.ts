"use client";

import { useChat, type Chat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

import type { AgentUIMessage } from "@/components/agent/types";
import type { ReplyFill } from "@/components/web-forms/reply-fill-store";

const THROTTLE_MS = 100;

type Fill = ReplyFill & { toolCallId: string };

// Las respuestas que escribió fillWebFormReply en una conversación, en orden.
export const collectReplyFills = (messages: AgentUIMessage[]): Fill[] =>
  messages.flatMap((message) =>
    message.parts.flatMap((part) =>
      part.type === "tool-fillWebFormReply" && part.state === "output-available" && part.output.ok
        ? [
            {
              toolCallId: part.toolCallId,
              formId: part.output.data.formId,
              name: part.output.data.name,
              subject: part.output.data.subject,
              body: part.output.data.body,
            },
          ]
        : []
    )
  );

// Como Nueva factura (use-invoice-form-patches.ts): cada fillWebFormReply
// nuevo se aplica una sola vez, apenas llega. Los de una conversación abierta
// del historial ya estaban al montar y no se repiten (key por chat).
export const useWebFormReplyFills = (chat: Chat<AgentUIMessage>, onFill: (fill: ReplyFill) => void) => {
  const { messages } = useChat<AgentUIMessage>({ chat, throttle: THROTTLE_MS });
  const applied = useRef<Set<string> | null>(null);
  if (applied.current === null) applied.current = new Set(collectReplyFills(chat.messages).map((fill) => fill.toolCallId));
  const onFillRef = useRef(onFill);
  useEffect(() => {
    onFillRef.current = onFill;
  });

  useEffect(() => {
    const seen = applied.current!;
    for (const fill of collectReplyFills(messages)) {
      if (seen.has(fill.toolCallId)) continue;
      seen.add(fill.toolCallId);
      onFillRef.current({ formId: fill.formId, name: fill.name, subject: fill.subject, body: fill.body });
    }
  }, [messages]);
};
