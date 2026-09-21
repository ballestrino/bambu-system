"use client";

import { History, PanelRightClose, SquarePen } from "lucide-react";

import { AgentCostBadge } from "@/components/agent/agent-cost-badge";
import { AgentModeSelect } from "@/components/agent/agent-mode-select";
import type { AgentSession } from "@/components/agent/hooks/use-agent-session";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Cabecera del Sheet: título de la conversación, contexto, historial, nueva
// conversación, modo y costo. En el teléfono va en dos filas.
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
    <SheetHeader className="gap-2 border-b px-3 py-2 sm:px-4">
      <div className="flex items-center gap-1">
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 sm:size-9" aria-label="Cerrar asistente">
            <PanelRightClose aria-hidden />
          </Button>
        </SheetClose>
        <div className="min-w-0 flex-1">
          <SheetTitle className="truncate text-base">{session.title ?? "Nueva conversación"}</SheetTitle>
          <SheetDescription className="truncate text-xs">{contextLabel}</SheetDescription>
        </div>
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
      <div className="flex flex-wrap items-center gap-2">
        <AgentModeSelect mode={session.mode} modes={session.modes} onChange={session.changeMode} />
        <AgentCostBadge
          conversationId={session.conversationId}
          persisted={session.persisted}
          onClick={onOpenCosts}
        />
      </div>
    </SheetHeader>
  );
}
