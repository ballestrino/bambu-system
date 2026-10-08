"use client";

import { History } from "lucide-react";

import { AgentConversationList } from "@/components/agent/agent-conversation-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AgentConversationScope } from "@/lib/agent/conversation-scope";

const DESCRIPTIONS: Record<AgentConversationScope["kind"], string> = {
  budget: "Conversaciones de este presupuesto.",
  "no-budget": "Conversaciones sin presupuesto guardado.",
  all: "Todas tus conversaciones con el agente.",
};

// El historial en un diálogo: el del Sheet, y el de la página en el teléfono
// (en escritorio la lista va en una columna).
export function AgentHistoryDialog({
  open,
  onOpenChange,
  scope,
  activeId,
  onSelect,
  onDeleted,
  onOpenCosts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: AgentConversationScope;
  activeId: string | null;
  onSelect: (conversationId: string) => void;
  onDeleted: (conversationId: string) => void;
  onOpenCosts: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* El foco va al diálogo y no al buscador: en el teléfono el teclado
          saltaba apenas se abría el historial. */}
      <DialogContent
        className="flex h-[80vh] flex-col gap-0 p-0 sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
        }}
      >
        <DialogHeader className="border-b px-4 py-3 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5" aria-hidden /> Historial
          </DialogTitle>
          <DialogDescription>{DESCRIPTIONS[scope.kind]}</DialogDescription>
        </DialogHeader>
        <AgentConversationList
          scope={scope}
          enabled={open}
          activeId={activeId}
          showBudget={scope.kind === "all"}
          onSelect={onSelect}
          onDeleted={onDeleted}
          onOpenCosts={onOpenCosts}
        />
      </DialogContent>
    </Dialog>
  );
}
