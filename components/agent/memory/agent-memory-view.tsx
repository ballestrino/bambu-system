"use client";

import { Brain, RefreshCw } from "lucide-react";
import { useState } from "react";

import { useAgentMemories } from "@/components/agent/hooks/use-agent-memories";
import { AgentMemoryDeleteDialog, AgentMemoryEditDialog } from "@/components/agent/memory/agent-memory-dialogs";
import { AgentMemoryRowItem, type MemoryAction } from "@/components/agent/memory/agent-memory-row";
import type { AgentMemoryRow } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AGENT_MEMORY_KINDS, isMemoryActive, MEMORY_KIND_LABELS, type AgentMemoryKind } from "@/lib/agent/memory";
import { cn } from "@/lib/utils";

type Filter = AgentMemoryKind | "ALL" | "EXPIRED";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "Vigentes" },
  ...AGENT_MEMORY_KINDS.map((kind) => ({ id: kind, label: MEMORY_KIND_LABELS[kind] })),
  { id: "EXPIRED", label: "Vencidas" },
];

const matches = (filter: Filter, memory: AgentMemoryRow, now: Date) => {
  const active = isMemoryActive(memory, now);
  if (filter === "EXPIRED") return !active;
  return active && (filter === "ALL" || memory.kind === filter);
};

// Lo que el agente recuerda en todas las conversaciones. Se suma desde el chat
// (el agente lo propone y un admin lo confirma); acá se edita, se vence o se
// elimina.
export function AgentMemoryView() {
  const { query, update, expire, remove } = useAgentMemories();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<AgentMemoryRow | null>(null);
  const [deleting, setDeleting] = useState<AgentMemoryRow | null>(null);
  const now = new Date();
  const memories = query.data ?? [];
  const count = (id: Filter) => memories.filter((memory) => matches(id, memory, now)).length;
  const shown = memories.filter((memory) => matches(filter, memory, now));

  const onAction = (action: MemoryAction, memory: AgentMemoryRow) => {
    if (action === "edit") setEditing(memory);
    else if (action === "delete") setDeleting(memory);
    else expire.mutate(memory.id);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Brain className="size-5 text-ops-bamboo-strong" aria-hidden />
            Memoria del agente
          </h1>
          <p className="max-w-prose text-sm text-ops-text-muted">
            Datos y preferencias que el agente usa en todas las conversaciones. Se suman desde el chat: el
            agente propone y un admin confirma en la tarjeta.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-11 shrink-0 sm:size-9"
          aria-label="Refrescar"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RefreshCw className={cn(query.isFetching && "animate-spin")} aria-hidden />
        </Button>
      </header>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filtrar memorias">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={filter === option.id}
            onClick={() => setFilter(option.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap",
              filter === option.id
                ? "border-ops-bamboo-strong bg-ops-bamboo-soft font-medium text-ops-bamboo-strong"
                : "border-ops-border text-ops-text-muted hover:bg-ops-surface-muted"
            )}
          >
            {option.label}
            {query.data && <span className="ml-1.5 tabular-nums opacity-70">{count(option.id)}</span>}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Cargando la memoria">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
          <span>{query.error.message}</span>
          <Button variant="outline" className="h-11 sm:h-9" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ops-border px-4 py-10 text-center text-sm text-ops-text-muted">
          {filter === "EXPIRED"
            ? "No hay memorias vencidas."
            : memories.length
              ? "No hay memorias de este tipo."
              : "Todavía no hay memorias. Pedile al agente que recuerde algo (\"acordate de que…\") y confirmalo en su tarjeta."}
        </p>
      ) : (
        <ul className="divide-y divide-ops-border overflow-hidden rounded-xl border border-ops-border bg-ops-surface">
          {shown.map((memory) => (
            <AgentMemoryRowItem key={memory.id} memory={memory} now={now} onAction={onAction} />
          ))}
        </ul>
      )}

      <AgentMemoryEditDialog memory={editing} update={update} onClose={() => setEditing(null)} />
      <AgentMemoryDeleteDialog memory={deleting} remove={remove} onClose={() => setDeleting(null)} />
    </div>
  );
}
