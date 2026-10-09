"use client";

import { History, PanelRightClose, SquarePen } from "lucide-react";

import { AgentCostBadge } from "@/components/agent/agent-cost-badge";
import { AgentOpenPageButton } from "@/components/agent/agent-open-page-button";
import type { AgentSession } from "@/components/agent/hooks/use-agent-session";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Cabecera del Sheet: título de la conversación, contexto, lo gastado en la
// conversación, abrir en la página, historial y nueva conversación. El modo va
// en el composer.
export function AgentSheetHeader({
  session,
  contextLabel,
  onOpenHistory,
  onOpenCosts,
}: {
  session: AgentSession;
  contextLabel: string;
  onOpenHistory: () => void;
  onOpenCosts: () => void;
}) {
  return (
    <SheetHeader className="gap-2 border-b border-ops-surface-muted px-3 py-2 sm:px-4">
      <div className="flex items-center gap-1">
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 sm:size-9" aria-label="Cerrar asistente">
            <PanelRightClose aria-hidden />
          </Button>
        </SheetClose>
        <div className="min-w-0 flex-1">
          <SheetTitle className="truncate text-[15px]">{session.title ?? "Nueva conversación"}</SheetTitle>
          <SheetDescription className="truncate text-xs text-ops-text-muted">{contextLabel}</SheetDescription>
        </div>
        <AgentCostBadge
          conversationId={session.conversationId}
          persisted={session.persisted}
          onClick={onOpenCosts}
        />
        <AgentOpenPageButton
          chat={session.chat}
          conversationId={session.conversationId}
          persisted={session.persisted}
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 sm:size-9"
          onClick={onOpenHistory}
          aria-label="Historial de conversaciones"
          title="Historial"
        >
          <History aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 sm:size-9"
          onClick={session.startNew}
          aria-label="Nueva conversación"
          title="Nueva conversación"
        >
          <SquarePen aria-hidden />
        </Button>
      </div>
    </SheetHeader>
  );
}
