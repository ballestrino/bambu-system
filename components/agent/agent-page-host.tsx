"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AgentConversationList } from "@/components/agent/agent-conversation-list";
import { AgentCostDialog } from "@/components/agent/agent-cost-dialog";
import { agentPageFullScreen } from "@/components/agent/agent-page-full-screen";
import { AgentPageHeader } from "@/components/agent/agent-page-header";
import { AgentSessionBody } from "@/components/agent/agent-session-body";
import { useAgentPageUrl } from "@/components/agent/hooks/use-agent-page-url";
import { useAgentPageView } from "@/components/agent/hooks/use-agent-page-view";
import { useAgentSession } from "@/components/agent/hooks/use-agent-session";
import { useConversationActions } from "@/components/agent/hooks/use-conversation-actions";
import { useEdgeSwipeBack } from "@/components/agent/hooks/use-edge-swipe-back";
import { useKeyboardViewport } from "@/components/agent/hooks/use-keyboard-viewport";
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
//
// Con lugar (container query del panel, 56rem) va el diseño 2a: la columna del
// historial y la conversación. Sin lugar va el 2b: el historial es la
// pantalla de inicio y una conversación se abre a pantalla completa (en la app
// instalada, sin tabs: agentPageFullScreen y data-agent-view). Se vuelve con
// "‹ Agente" o deslizando desde el borde.
export function AgentPageHost() {
  const queryClient = useQueryClient();
  const session = useAgentSession({ scope: ALL_AGENT_CONVERSATIONS });
  const page = useAgentPageView();
  const [costsOpen, setCostsOpen] = useState(false);
  const chatRef = useEdgeSwipeBack<HTMLElement>(page.showList, page.view === "chat");
  useAgentPageUrl(session);
  useKeyboardViewport();

  const budget = session.conversation?.budget ?? null;
  // Borrar la abierta arranca una nueva; desde su cabecera, además se vuelve
  // al historial.
  const headerActions = useConversationActions((id) => {
    session.onConversationDeleted(id);
    page.showList();
  });

  const select = (id: string) => {
    page.showChat();
    if (id !== session.conversationId) void session.openConversation(id);
  };
  const startNew = () => {
    page.showChat();
    session.startNew();
  };
  const openCosts = () => setCostsOpen(true);

  // Una propuesta confirmada puede cambiar el nombre del presupuesto que
  // muestran la lista y la cabecera.
  const handleProposalConfirmed = () => {
    void queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
  };

  const listProps = {
    scope: ALL_AGENT_CONVERSATIONS,
    enabled: true,
    activeId: session.conversationId,
    showBudget: true,
    onSelect: select,
    onDeleted: session.onConversationDeleted,
    onOpenCosts: openCosts,
    onNew: startNew,
  };

  return (
    <TooltipProvider>
      <div
        data-agent-page
        data-view={page.view}
        className={cn(
          "flex h-[calc(100dvh-9.5rem-var(--bottom-tabs-space))] min-h-[32rem] w-full max-w-7xl flex-col md:h-[calc(100dvh-9rem)]",
          agentPageFullScreen,
          page.view === "list" && "app-tabs:bg-ops-canvas"
        )}
      >
        <div className="@container/panel min-h-0 flex-1">
          <div
            className={cn(
              opsSurface.panel,
              "grid h-full grid-cols-1 overflow-hidden shadow-[0_1px_2px_rgb(24_37_29/0.04)] @4xl/panel:grid-cols-[300px_minmax(0,1fr)] app-tabs:rounded-none app-tabs:border-0 app-tabs:shadow-none"
            )}
          >
            <aside
              aria-label="Conversaciones"
              className="hidden min-h-0 flex-col border-r border-ops-border bg-ops-canvas/60 @4xl/panel:flex"
            >
              <h1 className="sr-only">Agente</h1>
              <AgentConversationList {...listProps} />
            </aside>
            <div
              className={cn(
                "min-h-0 min-w-0 flex-col bg-ops-canvas @4xl/panel:hidden",
                page.view === "list" ? "flex" : "hidden"
              )}
            >
              <AgentConversationList {...listProps} variant="stack" />
            </div>
            <section
              ref={chatRef}
              aria-label="Conversación"
              className={cn(
                "@container/chat min-h-0 min-w-0 flex-col bg-ops-surface",
                page.view === "chat" ? "flex" : "hidden @4xl/panel:flex"
              )}
            >
              <AgentPageHeader
                session={session}
                onBack={page.showList}
                onNew={startNew}
                onOpenCosts={openCosts}
                onAction={(action, trigger) =>
                  session.conversation && headerActions.run(session.conversation, action, trigger)
                }
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
      {headerActions.dialogs}
      <AgentCostDialog
        open={costsOpen}
        onOpenChange={setCostsOpen}
        conversationId={session.persisted ? session.conversationId : null}
      />
    </TooltipProvider>
  );
}
