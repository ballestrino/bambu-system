"use client";

import { useChat, type Chat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

import type { AgentUIMessage } from "@/components/agent/types";
import type { NewInvoiceForm } from "@/lib/billing/new-invoice";

const THROTTLE_MS = 100;

type FormPatch = { toolCallId: string; patch: Partial<NewInvoiceForm> };

// Los campos que completó fillInvoiceForm en una conversación, en orden.
export const collectInvoiceFormPatches = (messages: AgentUIMessage[]): FormPatch[] =>
  messages.flatMap((message) =>
    message.parts.flatMap((part) =>
      part.type === "tool-fillInvoiceForm" && part.state === "output-available" && part.output.ok
        ? [{ patch: part.output.data.patch as Partial<NewInvoiceForm>, toolCallId: part.toolCallId }]
        : []
    )
  );

// Nueva factura (feature 46): cada fillInvoiceForm nuevo se aplica al
// formulario apenas llega su resultado, una sola vez. Los de una conversación
// abierta del historial ya estaban al montar y no se vuelven a aplicar (el
// componente se monta de nuevo con cada conversación: key por chat).
export const useInvoiceFormPatches = (chat: Chat<AgentUIMessage>, onPatch: (patch: Partial<NewInvoiceForm>) => void) => {
  const { messages } = useChat<AgentUIMessage>({ chat, throttle: THROTTLE_MS });
  const applied = useRef<Set<string> | null>(null);
  if (applied.current === null) applied.current = new Set(collectInvoiceFormPatches(chat.messages).map((item) => item.toolCallId));
  const onPatchRef = useRef(onPatch);
  useEffect(() => {
    onPatchRef.current = onPatch;
  });

  useEffect(() => {
    const seen = applied.current!;
    for (const item of collectInvoiceFormPatches(messages)) {
      if (seen.has(item.toolCallId)) continue;
      seen.add(item.toolCallId);
      onPatchRef.current(item.patch);
    }
  }, [messages]);
};
