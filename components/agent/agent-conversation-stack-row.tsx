"use client";

import { ChevronRight, FileText, MoreHorizontal, Pencil, Pin, PinOff, Sparkles, Trash2 } from "lucide-react";

import { AgentConversationMenu, type ConversationActionHandler } from "@/components/agent/agent-conversation-menu";
import { ConversationSubtitle } from "@/components/agent/agent-conversation-row";
import { useSwipeReveal } from "@/components/agent/hooks/use-swipe-reveal";
import type { AgentConversationItem } from "@/components/agent/types";
import { conversationActivity, formatConversationTime } from "@/lib/agent/conversation-groups";
import { cn } from "@/lib/utils";

// Fijar 72 + Renombrar 84 + Borrar 72, como en el diseño.
const ACTIONS_WIDTH = 228;

const actionClass =
  "flex flex-col items-center justify-center gap-0.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset";

// Una conversación en el historial del teléfono (la pantalla de inicio del tab
// Agente): ícono, título, presupuesto y hora. Deslizarla a la izquierda
// muestra Fijar, Renombrar y Borrar; con mouse, el "…" reemplaza a la flecha.
export function AgentConversationStackRow({
  conversation,
  now,
  first,
  revealed,
  onRevealedChange,
  onSelect,
  onAction,
}: {
  conversation: AgentConversationItem;
  now: Date;
  first: boolean;
  revealed: boolean;
  onRevealedChange: (revealed: boolean) => void;
  onSelect: () => void;
  onAction: ConversationActionHandler;
}) {
  const swipe = useSwipeReveal({ open: revealed, width: ACTIONS_WIDTH, onOpenChange: onRevealedChange });
  const pinned = Boolean(conversation.pinnedAt);
  const Icon = conversation.budget ? FileText : Sparkles;
  const act = (action: Parameters<ConversationActionHandler>[0]) => () => {
    onRevealedChange(false);
    onAction(action, null);
  };
  const actionTab = revealed ? 0 : -1;

  return (
    <li className={cn("relative overflow-hidden", !first && "border-t border-ops-surface-muted")}>
      <div className="absolute inset-y-0 right-0 flex" aria-hidden={!revealed}>
        <button type="button" tabIndex={actionTab} onClick={act("pin")} className={cn(actionClass, "w-[72px] bg-ops-bamboo text-white")}>
          {pinned ? <PinOff className="size-[17px]" aria-hidden /> : <Pin className="size-[17px]" aria-hidden />}
          {pinned ? "Desfijar" : "Fijar"}
        </button>
        <button type="button" tabIndex={actionTab} onClick={act("rename")} className={cn(actionClass, "w-[84px] bg-ops-border text-ops-bamboo-strong")}>
          <Pencil className="size-[17px]" aria-hidden />
          Renombrar
        </button>
        <button type="button" tabIndex={actionTab} onClick={act("delete")} className={cn(actionClass, "w-[72px] bg-[#C0392B] text-white")}>
          <Trash2 className="size-[17px]" aria-hidden />
          Borrar
        </button>
      </div>
      <div
        {...swipe.handlers}
        style={{ transform: `translateX(${swipe.offset}px)` }}
        className={cn(
          "relative flex touch-pan-y items-center bg-ops-surface",
          !swipe.dragging && "transition-transform duration-200 ease-out"
        )}
      >
        <button
          type="button"
          onClick={revealed ? () => onRevealedChange(false) : onSelect}
          className="flex min-h-[66px] min-w-0 flex-1 items-center gap-3 py-2 pl-3.5 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset active:bg-ops-surface-muted"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ops-bamboo-soft text-ops-bamboo-strong">
            <Icon className="size-[17px]" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-medium">{conversation.title}</span>
            <ConversationSubtitle conversation={conversation} showBudget className="text-[13px] text-ops-text-muted [&_svg]:hidden" />
          </span>
          <span className="shrink-0 text-xs text-ops-text-muted tabular-nums">
            {formatConversationTime(conversationActivity(conversation), now)}
          </span>
          <ChevronRight className="mr-3 size-4 shrink-0 text-ops-text-muted/60 [@media(hover:hover)]:hidden" aria-hidden />
        </button>
        <AgentConversationMenu pinned={pinned} onAction={onAction}>
          <button
            type="button"
            aria-label={`Opciones de “${conversation.title}”`}
            className="mr-1.5 hidden size-9 shrink-0 place-items-center rounded-lg text-ops-bamboo-strong hover:bg-ops-surface-muted [@media(hover:hover)]:grid"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        </AgentConversationMenu>
      </div>
    </li>
  );
}
