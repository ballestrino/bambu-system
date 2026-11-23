"use client";

import {
  ArrowUpRight,
  ChevronLeft,
  CircleDollarSign,
  FileText,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
} from "lucide-react";
import Link from "next/link";

import { AgentConversationMenu, type ConversationActionHandler } from "@/components/agent/agent-conversation-menu";
import { AgentCostBadge } from "@/components/agent/agent-cost-badge";
import { AgentFoldProposalsItem } from "@/components/agent/agent-fold-proposals-item";
import type { AgentSession } from "@/components/agent/hooks/use-agent-session";
import { getBudgetUrl } from "@/lib/agent/proposals";

const iconButton =
  "hidden size-[34px] shrink-0 place-items-center rounded-[10px] text-ops-text hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none @4xl/panel:grid";

// Cabecera de la conversación en la página. Con la columna del historial
// (escritorio, 2a): título, presupuesto con link, lo gastado en la
// conversación y el "…". Sin lugar para la columna (teléfono, 2b): "‹ Agente"
// para volver al historial, título y contexto al centro y el "…". El menú
// suma Nueva conversación y Costos de IA a Fijar, Renombrar y Borrar, y al
// pie "Plegar las propuestas". En escritorio, un botón fijo a la izquierda
// oculta y muestra la columna de conversaciones; oculta, al lado aparece
// Nueva conversación (en el teléfono no hay columna: no cambia nada).
export function AgentPageHeader({
  session,
  onBack,
  onNew,
  onOpenCosts,
  onAction,
  conversationsHidden,
  onToggleConversations,
}: {
  session: AgentSession;
  onBack: () => void;
  onNew: () => void;
  onOpenCosts: () => void;
  onAction: ConversationActionHandler;
  conversationsHidden: boolean;
  onToggleConversations: () => void;
}) {
  const conversation = session.conversation;
  const budget = conversation?.budget ?? null;
  const title = session.title ?? "Nueva conversación";
  const toggleLabel = conversationsHidden ? "Mostrar conversaciones" : "Ocultar conversaciones";
  const ToggleIcon = conversationsHidden ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="grid h-14 shrink-0 grid-cols-[6rem_minmax(0,1fr)_6rem] items-center border-b border-ops-surface-muted px-1 @4xl/panel:flex @4xl/panel:h-16 @4xl/panel:gap-3 @4xl/panel:gap-2 @4xl/panel:pr-5 @4xl/panel:pl-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 items-center rounded-lg pr-2 text-[17px] text-ops-bamboo-strong focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none @4xl/panel:hidden"
      >
        <ChevronLeft className="size-7" aria-hidden />
        Agente
      </button>
      <button
        type="button"
        onClick={onToggleConversations}
        aria-expanded={!conversationsHidden}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={iconButton}
      >
        <ToggleIcon className="size-[18px]" aria-hidden />
      </button>
      {conversationsHidden && (
        <button type="button" onClick={onNew} aria-label="Nueva conversación" title="Nueva conversación" className={iconButton}>
          <SquarePen className="size-[18px]" aria-hidden />
        </button>
      )}
      <div className="flex min-w-0 flex-col items-center gap-px text-center @4xl/panel:flex-1 @4xl/panel:items-start @4xl/panel:gap-[3px] @4xl/panel:text-left">
        <h2 className="max-w-full truncate text-[15px] font-semibold">{title}</h2>
        {budget ? (
          <Link
            href={getBudgetUrl(budget.slug)}
            className="inline-flex max-w-full items-center gap-1 text-[11.5px] text-ops-text-muted underline-offset-4 hover:underline @4xl/panel:text-xs @4xl/panel:font-medium @4xl/panel:text-ops-bamboo-strong"
          >
            <FileText className="hidden size-[13px] shrink-0 @4xl/panel:block" aria-hidden />
            <span className="min-w-0 truncate">{budget.name}</span>
            <ArrowUpRight className="hidden size-3 shrink-0 @4xl/panel:block" aria-hidden />
          </Link>
        ) : (
          <p className="truncate text-[11.5px] text-ops-text-muted @4xl/panel:text-xs">Sin presupuesto</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-1">
        {/* Una conversación nueva todavía no gastó nada. */}
        {session.persisted && (
          <span className="hidden @4xl/panel:inline-flex">
            <AgentCostBadge conversationId={session.conversationId} persisted onClick={onOpenCosts} />
          </span>
        )}
        <AgentConversationMenu
          pinned={conversation ? Boolean(conversation.pinnedAt) : null}
          onAction={onAction}
          extraItems={[
            { label: "Nueva conversación", icon: <SquarePen aria-hidden />, onSelect: onNew },
            { label: "Costos de IA", icon: <CircleDollarSign aria-hidden />, onSelect: onOpenCosts },
          ]}
          footer={<AgentFoldProposalsItem />}
        >
          <button
            type="button"
            aria-label="Opciones de la conversación"
            className="grid size-11 place-items-center rounded-[10px] text-ops-bamboo-strong hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none data-[state=open]:bg-ops-surface-muted @4xl/panel:size-[34px] @4xl/panel:text-ops-text"
          >
            <MoreHorizontal className="size-[22px] @4xl/panel:size-[18px]" aria-hidden />
          </button>
        </AgentConversationMenu>
      </div>
    </header>
  );
}
