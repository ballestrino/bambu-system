"use client";

import { CircleDollarSign, History, Search } from "lucide-react";
import { useState } from "react";

import { AgentDeleteDialog, AgentRenameDialog } from "@/components/agent/agent-conversation-dialogs";
import { AgentConversationRow } from "@/components/agent/agent-conversation-row";
import { useAgentConversations } from "@/components/agent/hooks/use-agent-queries";
import type { AgentConversationItem } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createSearchMatcher } from "@/lib/search-text";

// El diálogo de una fila. Cerrar solo apaga open: la conversación y el botón
// siguen hasta que Radix termina de cerrar y le devuelve el foco al botón.
type RowDialog = {
  kind: "rename" | "delete";
  conversation: AgentConversationItem;
  trigger: HTMLElement | null;
  open: boolean;
};

// Conversaciones del presupuesto abierto (o las de crear, sin presupuesto),
// con búsqueda por título y el costo de cada una.
export function AgentHistoryDialog({
  open,
  onOpenChange,
  budgetId,
  activeId,
  onSelect,
  onDeleted,
  onOpenCosts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string | null;
  activeId: string | null;
  onSelect: (conversationId: string) => void;
  onDeleted: (conversationId: string) => void;
  onOpenCosts: () => void;
}) {
  const list = useAgentConversations(budgetId, open);
  const [query, setQuery] = useState("");
  const [rowDialog, setRowDialog] = useState<RowDialog | null>(null);
  const closeRowDialog = () => setRowDialog((current) => current && { ...current, open: false });
  const dialogFor = (kind: RowDialog["kind"]) => ({
    open: rowDialog?.kind === kind && rowDialog.open,
    conversation: rowDialog?.kind === kind ? rowDialog.conversation : null,
    returnFocusTo: rowDialog?.trigger,
    onClose: closeRowDialog,
  });
  const matches = createSearchMatcher(query);
  const rows = (list.data ?? []).filter((conversation) => matches([conversation.title]));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[80vh] flex-col gap-0 p-0 sm:max-w-md">
          <DialogHeader className="border-b px-4 py-3 pr-12 text-left">
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5" aria-hidden /> Historial
            </DialogTitle>
            <DialogDescription>
              {budgetId ? "Conversaciones de este presupuesto." : "Conversaciones sin presupuesto guardado."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 border-b px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título…"
                aria-label="Buscar conversaciones"
                className="h-11 pl-9 sm:h-9"
              />
            </div>
            <Button variant="outline" className="h-11 sm:h-9" onClick={onOpenCosts}>
              <CircleDollarSign aria-hidden />
              Costos
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {list.isPending ? (
              <div className="space-y-2" aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : list.isError ? (
              <p className="py-8 text-center text-sm text-destructive">{list.error.message}</p>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {query ? "Ninguna conversación coincide con la búsqueda." : "Todavía no hay conversaciones."}
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.map((conversation) => (
                  <AgentConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === activeId}
                    onSelect={() => onSelect(conversation.id)}
                    onRename={(trigger) => setRowDialog({ kind: "rename", conversation, trigger, open: true })}
                    onDelete={(trigger) => setRowDialog({ kind: "delete", conversation, trigger, open: true })}
                  />
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AgentRenameDialog {...dialogFor("rename")} />
      <AgentDeleteDialog {...dialogFor("delete")} onDeleted={onDeleted} />
    </>
  );
}
