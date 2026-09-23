"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AgentConversationList } from "@/components/agent/agent-conversation-list";
import { AgentCostDialog } from "@/components/agent/agent-cost-dialog";
import { AgentHistoryDialog } from "@/components/agent/agent-history-dialog";
import { AgentPageHeader } from "@/components/agent/agent-page-header";
import { AgentSessionBody } from "@/components/agent/agent-session-body";
import { useAgentPageUrl } from "@/components/agent/hooks/use-agent-page-url";
import { useAgentSession } from "@/components/agent/hooks/use-agent-session";
import { agentKeys } from "@/components/agent/query-keys";
import { opsSurface } from "@/components/ops/shared/ops-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ALL_AGENT_CONVERSATIONS,
  pageBudgetContext,
  pageContextLabel,
} from "@/lib/agent/conversation-scope";
import { cn } from "@/lib/utils";

// La página del agente: el mismo de "Generar con IA", a ancho completo y con
// todas las conversaciones. Una conversación de un presupuesto sigue hablando
// de él; las nuevas van sin presupuesto. El alto es fijo (el alto de la
// pantalla menos el nav y el padding del dashboard): los mensajes scrollean
// adentro y el composer queda siempre a la vista.
export function AgentPageHost() {
  const queryClient = useQueryClient();
  const session = useAgentSession({ scope: ALL_AGENT_CONVERSATIONS });
  const [dialog, setDialog] = useState<"history" | "costs" | null>(null);
  useAgentPageUrl(session);

  const budget = session.conversation?.budget ?? null;

  const select = (id: string) => {
    setDialog(null);
    if (id !== session.conversationId) void session.openConversation(id);
  };

  // Una propuesta confirmada puede cambiar el nombre del presupuesto que
  // muestran la lista y la cabecera.
  const handleProposalConfirmed = () => {
    void queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
  };

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100dvh-9.5rem)] min-h-[32rem] w-full max-w-7xl flex-col gap-3 md:h-[calc(100dvh-9rem)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agente</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Presupuestos, correos y consejos con los datos de Bambú. Es el mismo de “Generar con IA”:
            las conversaciones se comparten.
          </p>
        </div>
        {/* La columna del historial depende del ancho del panel, no de la
            ventana: con el sidebar abierto a 1024 px el chat quedaría más
            angosto que el Sheet. Sin lugar, el historial va en su diálogo. */}
        <div className="@container/panel min-h-0 flex-1">
          <div
            className={cn(
              opsSurface.panel,
              "grid h-full overflow-hidden @4xl/panel:grid-cols-[20rem_minmax(0,1fr)]"
            )}
          >
            <aside aria-label="Conversaciones" className="hidden min-h-0 flex-col border-r @4xl/panel:flex">
              <AgentConversationList
                scope={ALL_AGENT_CONVERSATIONS}
                enabled
                activeId={session.conversationId}
                showBudget
                onSelect={select}
                onDeleted={session.onConversationDeleted}
                onOpenCosts={() => setDialog("costs")}
              />
            </aside>
            <section aria-label="Conversación" className="@container/chat flex min-h-0 min-w-0 flex-col">
              <AgentPageHeader
                session={session}
                onOpenHistory={() => setDialog("history")}
                onOpenCosts={() => setDialog("costs")}
              />
              <AgentSessionBody
                session={session}
                contextLabel={pageContextLabel(budget)}
                getContext={() => pageBudgetContext(budget)}
                onProposalConfirmed={handleProposalConfirmed}
              />
            </section>
          </div>
        </div>
      </div>
      <AgentHistoryDialog
        open={dialog === "history"}
        onOpenChange={(next) => setDialog(next ? "history" : null)}
        scope={ALL_AGENT_CONVERSATIONS}
        activeId={session.conversationId}
        onSelect={select}
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
}
