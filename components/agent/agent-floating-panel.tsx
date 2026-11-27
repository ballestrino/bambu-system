"use client";

import type { Chat } from "@ai-sdk/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AgentCostDialog } from "@/components/agent/agent-cost-dialog";
import { AgentHistoryDialog } from "@/components/agent/agent-history-dialog";
import { AgentSessionBody } from "@/components/agent/agent-session-body";
import { AgentSheetHeader } from "@/components/agent/agent-sheet-header";
import { useAgentSession } from "@/components/agent/hooks/use-agent-session";
import { useKeyboardViewport } from "@/components/agent/hooks/use-keyboard-viewport";
import type { AgentUIMessage } from "@/components/agent/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AgentConversationScope } from "@/lib/agent/conversation-scope";
import type { AgentSkillId } from "@/lib/agent/skills";
import { cn } from "@/lib/utils";
import type { AgentBudgetContextInput } from "@/schemas/agent";

export type AgentFloatingPanelProps = {
  // Qué historial acompaña al panel: el de Facturación o todas (como Panda).
  scope: AgentConversationScope;
  getContext: () => AgentBudgetContextInput | undefined;
  contextLabel: string;
  // Sin habilidad fija: la General, con todas las tools (como Panda).
  skill?: AgentSkillId;
  // Retomar la última conversación del historial al abrir (Facturación) o
  // arrancar una nueva.
  resumeLatest?: boolean;
  // Cuando cambia (otro formulario elegido), la conversación con mensajes
  // queda en el historial y arranca una nueva: cada cosa con su chat.
  freshKey?: string | null;
  // Para el botón de escritorio (el del teléfono es flotante).
  buttonLabel?: string;
  onOpenChange?: (open: boolean) => void;
  // Lo que sigue la conversación aunque el panel esté cerrado (el stream no
  // se corta al cerrarlo): Nueva factura aplica ahí los campos que completa.
  renderListener?: (chat: Chat<AgentUIMessage>) => ReactNode;
};

// El agente en un panel flotante: en escritorio arriba a la derecha, sin
// tapar el uso de la página; en el teléfono, un botón flotante que abre una
// hoja casi a pantalla completa. Lo usan Facturación (billing-agent.tsx) y
// Formularios web (feature 75).
export function AgentFloatingPanel({
  scope,
  getContext,
  contextLabel,
  skill,
  resumeLatest = true,
  freshKey,
  buttonLabel = "Agente",
  onOpenChange,
  renderListener,
}: AgentFloatingPanelProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"history" | "costs" | null>(null);
  const session = useAgentSession({ scope, resumeLatest });
  useKeyboardViewport(open && isMobile);
  const lastKey = useRef(freshKey);
  const { chat, startNew } = session;

  useEffect(() => {
    if (freshKey === lastKey.current) return;
    lastKey.current = freshKey;
    // Un turno en curso sigue en su conversación; la próxima vez arranca otra.
    const answering = chat?.status === "submitted" || chat?.status === "streaming";
    if (chat && chat.messages.length > 0 && !answering) startNew();
  }, [freshKey, chat, startNew]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (next) void session.ensureStarted();
  };

  const body = (
    <TooltipProvider>
      <AgentSheetHeader
        session={session}
        contextLabel={contextLabel}
        onOpenHistory={() => setDialog("history")}
        onOpenCosts={() => setDialog("costs")}
      />
      <AgentSessionBody
        session={session}
        contextLabel={contextLabel}
        getContext={getContext}
        onProposalConfirmed={() => undefined}
        skill={skill}
      />
      <AgentHistoryDialog
        open={dialog === "history"}
        onOpenChange={(next) => setDialog(next ? "history" : null)}
        scope={scope}
        activeId={session.conversationId}
        onSelect={(id) => {
          setDialog(null);
          if (id !== session.conversationId) void session.openConversation(id);
        }}
        onDeleted={session.onConversationDeleted}
        onOpenCosts={() => setDialog("costs")}
      />
      <AgentCostDialog
        open={dialog === "costs"}
        onOpenChange={(next) => setDialog(next ? "costs" : null)}
        conversationId={session.persisted ? session.conversationId : null}
      />
    </TooltipProvider>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} modal={isMobile}>
      {session.chat && renderListener ? renderListener(session.chat) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => handleOpenChange(!open)}
        className={cn(
          "inline-flex items-center gap-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none",
          isMobile
            ? "fixed right-4 bottom-[calc(5.5rem+var(--bottom-tabs-space))] z-40 size-14 justify-center rounded-full bg-ops-bamboo-strong text-white shadow-lg"
            : cn(
                "h-10 rounded-[var(--ops-radius-control)] border px-3.5 text-sm",
                open
                  ? "border-ops-bamboo/40 bg-ops-bamboo-soft text-ops-bamboo-strong"
                  : "border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted"
              )
        )}
        aria-label={`Agente de ${contextLabel}`}
      >
        <Sparkles aria-hidden className={isMobile ? "size-6" : "size-4"} />
        {isMobile ? null : buttonLabel}
      </button>
      {isMobile ? (
        <SheetContent
          side="bottom"
          data-agent-sheet
          className="flex h-[92dvh] flex-col gap-0 rounded-t-2xl p-0 [&>button]:hidden"
        >
          {body}
        </SheetContent>
      ) : (
        <DialogPrimitive.Portal>
          {/* Sin overlay y sin cerrarse al tocar afuera: la página sigue a mano
              (revisar el borrador mientras el agente lo cambia). */}
          <DialogPrimitive.Content
            data-agent-sheet
            onInteractOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="fixed top-4 right-4 z-40 flex h-[min(640px,calc(100dvh-2rem))] w-[400px] flex-col overflow-hidden rounded-2xl border border-ops-border bg-ops-surface shadow-2xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          >
            {body}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </Sheet>
  );
}
