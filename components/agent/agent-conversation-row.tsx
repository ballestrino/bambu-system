"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRef } from "react";

import { formatDateTime } from "@/components/agent/format";
import type { AgentConversationItem } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AGENT_MODES } from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";
import { cn } from "@/lib/utils";

type RowAction = (trigger: HTMLElement | null) => void;

// Una conversación del historial: abrirla, o renombrarla y borrarla desde su
// menú. El diálogo de la opción elegida se abre recién cuando el menú terminó
// de cerrarse: si no, el menú recupera el foco al cerrarse y el diálogo queda
// sin foco. El diálogo recibe el botón del menú para devolverle el foco.
export function AgentConversationRow({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: AgentConversationItem;
  active: boolean;
  onSelect: () => void;
  onRename: RowAction;
  onDelete: RowAction;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingAction = useRef<RowAction | null>(null);

  return (
    <li
      className={cn(
        "flex items-center gap-1 rounded-lg border bg-card pr-1 transition-colors hover:bg-accent/50",
        active && "border-primary/60 bg-accent/40"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className="min-h-11 min-w-0 flex-1 rounded-lg px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <p className="truncate text-sm font-medium">{conversation.title}</p>
        <p className="truncate text-xs text-muted-foreground tabular-nums">
          {formatDateTime(conversation.lastMessageAt ?? conversation.updatedAt)} ·{" "}
          {AGENT_MODES[conversation.mode].label} · {formatUsd(conversation.costUsd)}
        </p>
      </button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 sm:size-9"
            aria-label={`Opciones de “${conversation.title}”`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => {
            const action = pendingAction.current;
            pendingAction.current = null;
            if (!action) return;
            event.preventDefault();
            action(triggerRef.current);
          }}
        >
          <DropdownMenuItem onSelect={() => (pendingAction.current = onRename)}>
            <Pencil aria-hidden />
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => (pendingAction.current = onDelete)}>
            <Trash2 aria-hidden />
            Borrar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
