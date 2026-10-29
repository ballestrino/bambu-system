"use client";

import { Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/components/agent/format";
import type { AgentMemoryRow } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isMemoryActive, MEMORY_KIND_LABELS } from "@/lib/agent/memory";
import { getAgentPageUrl } from "@/lib/agent/page-url";
import { cn } from "@/lib/utils";

export type MemoryAction = "edit" | "expire" | "delete";

// Quién la confirmó, cuándo, de qué conversación salió y hasta cuándo vale.
function MemoryMeta({ memory, active }: { memory: AgentMemoryRow; active: boolean }) {
  return (
    <p className="text-xs leading-relaxed text-ops-text-muted">
      {MEMORY_KIND_LABELS[memory.kind]}
      {" · "}
      {memory.approvedBy ? `confirmada por ${memory.approvedBy}` : "confirmada"} el {formatDate(memory.approvedAt)}
      {memory.conversation && (
        <>
          {" · "}
          <Link
            href={getAgentPageUrl(memory.conversation.id)}
            className="underline-offset-4 hover:text-ops-text hover:underline"
          >
            {memory.conversation.title}
          </Link>
        </>
      )}
      {memory.expiresAt && (
        <span className={cn(!active && "font-medium text-amber-700 dark:text-amber-300")}>
          {" · "}
          {active ? `vale hasta el ${formatDate(memory.expiresAt)}` : `venció el ${formatDate(memory.expiresAt)}`}
        </span>
      )}
    </p>
  );
}

export function AgentMemoryRowItem({
  memory,
  now,
  onAction,
}: {
  memory: AgentMemoryRow;
  now: Date;
  onAction: (action: MemoryAction, memory: AgentMemoryRow) => void;
}) {
  const active = isMemoryActive(memory, now);
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("text-sm leading-snug", !active && "text-ops-text-muted")}>{memory.text}</p>
        <MemoryMeta memory={memory} active={active} />
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 sm:size-8" aria-label="Acciones de la memoria">
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40 rounded-xl">
          <DropdownMenuItem onSelect={() => onAction("edit", memory)}>
            <Pencil aria-hidden />
            Editar
          </DropdownMenuItem>
          {active && (
            <DropdownMenuItem onSelect={() => onAction("expire", memory)}>
              <Clock aria-hidden />
              Vencer ahora
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete", memory)}>
            <Trash2 aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
