"use client";

import { FileText, MoreHorizontal, Sparkles } from "lucide-react";

import { AgentConversationMenu, type ConversationActionHandler } from "@/components/agent/agent-conversation-menu";
import type { AgentConversationItem } from "@/components/agent/types";
import { conversationActivity, formatConversationTime } from "@/lib/agent/conversation-groups";
import { formatAgentModeLabel } from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";
import { cn } from "@/lib/utils";

// El modelo y el esfuerzo ("Haiku 5.5 Alto") y lo gastado. Como el badge: el uso sin precio no se muestra como
// US$ 0,00.
export const conversationCostLabel = (conversation: AgentConversationItem) =>
  `${formatAgentModeLabel(conversation.mode)} · ${formatUsd(conversation.costUsd)}${
    conversation.unpricedEvents > 0 ? " + sin precio" : ""
  }`;

// Debajo del título: el presupuesto en la página (que lista todos) y, en el
// historial de un presupuesto, el modo y el costo.
export function ConversationSubtitle({
  conversation,
  showBudget,
  className,
}: {
  conversation: AgentConversationItem;
  showBudget: boolean;
  className?: string;
}) {
  if (!showBudget) return <span className={cn("truncate tabular-nums", className)}>{conversationCostLabel(conversation)}</span>;
  const Icon = conversation.budget ? FileText : Sparkles;
  return (
    <span className={cn("flex min-w-0 items-center gap-1", className)}>
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{conversation.budget?.name ?? "Sin presupuesto"}</span>
    </span>
  );
}

// Una conversación de la columna de la página (y del historial del Sheet):
// título, hora y presupuesto. La abierta va resaltada y con su "…" a la
// vista; en las demás aparece al pasar el mouse (con pantalla táctil, siempre).
export function AgentConversationRow({
  conversation,
  active,
  showBudget,
  now,
  onSelect,
  onAction,
}: {
  conversation: AgentConversationItem;
  active: boolean;
  showBudget: boolean;
  now: Date;
  onSelect: () => void;
  onAction: ConversationActionHandler;
}) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        title={showBudget ? conversationCostLabel(conversation) : undefined}
        className={cn(
          "flex min-h-11 w-full flex-col gap-0.5 rounded-[10px] py-2 pr-10 pl-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          active ? "bg-ops-bamboo-soft" : "hover:bg-ops-surface-muted"
        )}
      >
        <span className="flex w-full items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13.5px]",
              active ? "font-semibold text-ops-bamboo-strong" : "font-medium"
            )}
          >
            {conversation.title}
          </span>
          <span className="shrink-0 text-[11px] text-ops-text-muted tabular-nums">
            {formatConversationTime(conversationActivity(conversation), now)}
          </span>
        </span>
        <ConversationSubtitle
          conversation={conversation}
          showBudget={showBudget}
          className={cn("w-full text-xs", active ? "text-ops-bamboo-strong/80" : "text-ops-text-muted")}
        />
      </button>
      <AgentConversationMenu
        pinned={Boolean(conversation.pinnedAt)}
        onAction={onAction}
      >
        <button
          type="button"
          aria-label={`Opciones de “${conversation.title}”`}
          className={cn(
            "absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ops-bamboo-strong transition-opacity hover:bg-ops-bamboo/15 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none data-[state=open]:opacity-100",
            !active && "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          )}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
      </AgentConversationMenu>
    </li>
  );
}
