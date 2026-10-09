"use client";

import { Pin } from "lucide-react";

import type { ConversationAction } from "@/components/agent/agent-conversation-menu";
import { AgentConversationRow } from "@/components/agent/agent-conversation-row";
import { AgentConversationStackRow } from "@/components/agent/agent-conversation-stack-row";
import type { AgentConversationItem } from "@/components/agent/types";
import type { groupConversations } from "@/lib/agent/conversation-groups";
import { cn } from "@/lib/utils";

export type ConversationListVariant = "sidebar" | "stack";

type Groups = ReturnType<typeof groupConversations<AgentConversationItem>>;

// Los grupos del historial con su título (el de las fijadas, con el pin). En
// la columna de escritorio las filas van sueltas; en el teléfono, cada grupo
// en una tarjeta como las listas de iOS.
export function AgentConversationGroups({
  groups,
  variant,
  activeId,
  showBudget,
  now,
  revealedId,
  onRevealedChange,
  onSelect,
  onAction,
}: {
  groups: Groups;
  variant: ConversationListVariant;
  activeId: string | null;
  showBudget: boolean;
  now: Date;
  revealedId: string | null;
  onRevealedChange: (conversationId: string | null) => void;
  onSelect: (conversationId: string) => void;
  onAction: (conversation: AgentConversationItem, action: ConversationAction, trigger: HTMLElement | null) => void;
}) {
  const stack = variant === "stack";
  return (
    <div className={cn("flex flex-col", stack ? "gap-[18px]" : "gap-3.5")}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label} className={cn("flex flex-col", stack ? "gap-1.5" : "gap-0.5")}>
          <h3
            className={cn(
              "flex items-center gap-1 font-semibold text-ops-text-muted",
              stack ? "px-1.5 text-[13px]" : "px-2 pb-1 text-[11px] tracking-wider uppercase"
            )}
          >
            {group.key === "pinned" && <Pin className={cn("text-ops-bamboo", stack ? "size-[13px]" : "size-3")} aria-hidden />}
            {group.label}
          </h3>
          <ul className={cn("flex flex-col", stack ? "overflow-hidden rounded-[14px] bg-ops-surface" : "gap-0.5")}>
            {group.items.map((conversation, index) =>
              stack ? (
                <AgentConversationStackRow
                  key={conversation.id}
                  conversation={conversation}
                  now={now}
                  first={index === 0}
                  revealed={revealedId === conversation.id}
                  onRevealedChange={(revealed) => onRevealedChange(revealed ? conversation.id : null)}
                  onSelect={() => onSelect(conversation.id)}
                  onAction={(action, trigger) => onAction(conversation, action, trigger)}
                />
              ) : (
                <AgentConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  showBudget={showBudget}
                  now={now}
                  onSelect={() => onSelect(conversation.id)}
                  onAction={(action, trigger) => onAction(conversation, action, trigger)}
                />
              )
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
