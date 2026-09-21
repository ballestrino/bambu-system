"use client";

import { useChat, type Chat } from "@ai-sdk/react";
import { Maximize2 } from "lucide-react";
import Link from "next/link";

import type { AgentUIMessage } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { getAgentPageUrl } from "@/lib/agent/page-url";

const LABEL = "Abrir en la página del agente";
const BUTTON_CLASS = "size-11 shrink-0 sm:size-9";

function OpenPageLink({ chat, href }: { chat: Chat<AgentUIMessage>; href: string }) {
  const { status } = useChat<AgentUIMessage>({ chat });
  // Salir de la pantalla corta el stream: mientras responde, se espera.
  if (status === "submitted" || status === "streaming") {
    return (
      <Button variant="ghost" size="icon" className={BUTTON_CLASS} disabled aria-label={`${LABEL} (disponible al terminar la respuesta)`}>
        <Maximize2 aria-hidden />
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="icon" className={BUTTON_CLASS}>
      <Link href={href} aria-label={LABEL} title="Abrir en página">
        <Maximize2 aria-hidden />
      </Link>
    </Button>
  );
}

// La conversación del Sheet en la página del agente, a ancho completo y con
// todo el historial. Si todavía no se guardó, la página arranca una nueva.
export function AgentOpenPageButton({
  chat,
  conversationId,
  persisted,
}: {
  chat: Chat<AgentUIMessage> | null;
  conversationId: string | null;
  persisted: boolean;
}) {
  if (!chat) {
    return (
      <Button variant="ghost" size="icon" className={BUTTON_CLASS} disabled aria-label={LABEL}>
        <Maximize2 aria-hidden />
      </Button>
    );
  }
  return <OpenPageLink chat={chat} href={getAgentPageUrl(persisted ? conversationId : null)} />;
}
