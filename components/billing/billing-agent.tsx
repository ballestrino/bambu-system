"use client";

import type { Chat } from "@ai-sdk/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

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
import { BILLING_AGENT_CONVERSATIONS } from "@/lib/agent/conversation-scope";
import type { AgentSkillId } from "@/lib/agent/skills";
import { cn } from "@/lib/utils";
import type { AgentBudgetContextInput } from "@/schemas/agent";

type Props = {
  getContext: () => AgentBudgetContextInput;
  contextLabel?: string;
  skill?: AgentSkillId;
  // Retomar la última conversación de Facturación al abrir (la página del
  // mes) o arrancar una nueva (Nueva factura).
  resumeLatest?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Lo que sigue la conversación aunque el panel esté cerrado (el stream no
  // se corta al cerrarlo): Nueva factura aplica ahí los campos que completa.
  renderListener?: (chat: Chat<AgentUIMessage>) => ReactNode;
};

// El agente en Facturación (docs/billing.md, "Diseño"): la habilidad
// Facturación con su historial y el mes que se mira como contexto. En
// escritorio es un panel flotante arriba a la derecha que deja usar la página;
// en el teléfono, un botón flotante que abre una hoja casi a pantalla
// completa. Lo que cambia en el borrador se ve al terminar cada turno
// (refreshAfterTurn relee el mes). Nueva factura lo usa con su formulario
// como contexto y la habilidad Nueva factura (feature 46).
export function BillingAgent({
  getContext,
  contextLabel = "Facturación",
  skill = "facturacion",
  resumeLatest = true,
  onOpenChange,
  renderListener,
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"history" | "costs" | null>(null);
  const session = useAgentSession({ scope: BILLING_AGENT_CONVERSATIONS, resumeLatest });
  useKeyboardViewport(open && isMobile);

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
        scope={BILLING_AGENT_CONVERSATIONS}
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
        {isMobile ? null : "Agente"}
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
            className="fixed top-20 right-4 z-40 flex h-[min(640px,calc(100dvh-6rem))] w-[400px] flex-col overflow-hidden rounded-2xl border border-ops-border bg-ops-surface shadow-2xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          >
            {body}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </Sheet>
  );
}
