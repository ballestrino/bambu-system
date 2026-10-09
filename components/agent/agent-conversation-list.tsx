"use client";

import { Plus, Search, SquarePen } from "lucide-react";
import { useState } from "react";

import { AgentConversationGroups, type ConversationListVariant } from "@/components/agent/agent-conversation-groups";
import { AgentMonthCostLink } from "@/components/agent/agent-month-cost-link";
import { useAgentConversations } from "@/components/agent/hooks/use-agent-queries";
import { useConversationActions } from "@/components/agent/hooks/use-conversation-actions";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { groupConversations } from "@/lib/agent/conversation-groups";
import { conversationListLimit, type AgentConversationScope } from "@/lib/agent/conversation-scope";
import { createSearchMatcher } from "@/lib/search-text";
import { cn } from "@/lib/utils";

// Las conversaciones de un historial, en grupos (Fijados, Hoy, Ayer y
// Anteriores), con búsqueda por título (y por presupuesto en la página),
// fijar, renombrar, borrar y el gasto del mes. "sidebar" es la columna de la
// página en escritorio y el diálogo del Sheet; "stack", la pantalla de inicio
// del agente en el teléfono, con título grande y filas que se deslizan.
export function AgentConversationList({
  scope,
  enabled,
  activeId,
  showBudget = false,
  variant = "sidebar",
  onSelect,
  onDeleted,
  onOpenCosts,
  onNew,
}: {
  scope: AgentConversationScope;
  enabled: boolean;
  activeId: string | null;
  showBudget?: boolean;
  variant?: ConversationListVariant;
  onSelect: (conversationId: string) => void;
  onDeleted: (conversationId: string) => void;
  onOpenCosts: () => void;
  onNew?: () => void;
}) {
  const list = useAgentConversations(scope, enabled);
  const [query, setQuery] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const actions = useConversationActions(onDeleted);
  const stack = variant === "stack";
  const matches = createSearchMatcher(query);
  const rows = (list.data ?? []).filter((conversation) =>
    matches([conversation.title, showBudget ? conversation.budget?.name : null])
  );
  // "Hoy" y "Ayer" se cuentan desde la última lectura: la app instalada puede
  // volver al frente días después, y al volver se relee.
  const now = new Date(list.dataUpdatedAt);
  // La búsqueda es sobre lo cargado: si llegó al tope, las más viejas no están.
  const limit = conversationListLimit(scope.kind === "all");
  const capped = (list.data?.length ?? 0) >= limit;

  const search = (
    <div className="relative flex-1">
      <Search
        className={cn("absolute top-1/2 -translate-y-1/2 text-ops-text-muted", stack ? "left-3 size-[17px]" : "left-2.5 size-[15px]")}
        aria-hidden
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={stack ? "Título o presupuesto" : "Buscar"}
        aria-label={showBudget ? "Buscar conversaciones por título o presupuesto" : "Buscar conversaciones"}
        className={cn(
          "border-0 shadow-none focus-visible:ring-2",
          stack
            ? "h-[38px] rounded-xl bg-ops-text/[0.06] pl-9 text-base md:text-base"
            : "h-11 rounded-[10px] bg-ops-surface-muted pl-8 text-base sm:h-9 sm:text-[13px]"
        )}
      />
    </div>
  );

  const body = list.isPending ? (
    <div className="space-y-2" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className={cn("w-full", stack ? "h-[66px] rounded-[14px]" : "h-14 rounded-[10px]")} />
      ))}
    </div>
  ) : list.isError ? (
    <p className="py-8 text-center text-sm text-destructive">{list.error.message}</p>
  ) : rows.length === 0 ? (
    <p className="py-8 text-center text-sm text-ops-text-muted">
      {query ? "Ninguna conversación coincide con la búsqueda." : "Todavía no hay conversaciones."}
    </p>
  ) : (
    <AgentConversationGroups
      groups={groupConversations(rows, now)}
      variant={variant}
      activeId={activeId}
      showBudget={showBudget}
      now={now}
      revealedId={revealedId}
      onRevealedChange={setRevealedId}
      onSelect={onSelect}
      onAction={actions.run}
    />
  );

  const cappedNote = capped && !list.isError && (
    <p className="px-2 pt-3 text-center text-xs text-ops-text-muted">
      Se muestran las {limit} conversaciones más recientes{query ? ": la búsqueda es sobre esas" : ""}.
    </p>
  );

  return (
    <>
      {stack ? (
        <>
          <div className="flex h-11 shrink-0 items-center justify-end px-2">
            {onNew && (
              <button
                type="button"
                onClick={onNew}
                aria-label="Nueva conversación"
                className="grid size-11 place-items-center rounded-full text-ops-bamboo-strong active:bg-ops-surface-muted"
              >
                <SquarePen className="size-[22px]" aria-hidden />
              </button>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-3 px-5 pb-2.5">
            <h1 className="text-[32px] leading-tight font-bold tracking-tight">Agente</h1>
            <div className="flex">{search}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-6 app-tabs:pb-[calc(var(--bottom-tabs-space)+1.5rem)]">
            {body}
            {cappedNote}
            <div className="mt-[18px]">
              <AgentMonthCostLink variant="card" onClick={onOpenCosts} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex shrink-0 gap-2 px-3.5 pt-3.5 pb-2.5">
            {search}
            {onNew && (
              <button
                type="button"
                onClick={onNew}
                title="Nueva conversación"
                aria-label="Nueva conversación"
                className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-ops-bamboo-strong text-ops-surface transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:size-9"
              >
                <Plus className="size-[18px]" aria-hidden />
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1">
            {body}
            {cappedNote}
          </div>
          <AgentMonthCostLink variant="footer" onClick={onOpenCosts} />
        </>
      )}
      {actions.dialogs}
    </>
  );
}
