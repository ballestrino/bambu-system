"use client";

import { useState } from "react";

import { useAgentConversationMutations } from "@/components/agent/hooks/use-agent-conversation-mutations";
import type { AgentConversationItem } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const TITLE_MAX = 120;

// Al cerrar, el foco vuelve al botón del menú de la fila si sigue en pantalla
// (después de borrar ya no está y Radix decide).
const focusBack = (target: HTMLElement | null | undefined) => (event: Event) => {
  if (!target?.isConnected) return;
  event.preventDefault();
  target.focus();
};

function RenameForm({ conversation, onDone }: { conversation: AgentConversationItem; onDone: () => void }) {
  const { rename } = useAgentConversationMutations();
  const [title, setTitle] = useState(conversation.title);
  const trimmed = title.trim();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!trimmed) return;
        rename.mutate({ id: conversation.id, title: trimmed }, { onSuccess: onDone });
      }}
    >
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={TITLE_MAX}
        aria-label="Nombre de la conversación"
        autoFocus
      />
      <DialogFooter>
        <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 sm:h-9" disabled={!trimmed || rename.isPending}>
          {rename.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Renombrar: el título del modelo nunca pisa un nombre puesto a mano.
export function AgentRenameDialog({
  conversation,
  open,
  returnFocusTo,
  onClose,
}: {
  open: boolean;
  conversation: AgentConversationItem | null;
  returnFocusTo?: HTMLElement | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={focusBack(returnFocusTo)}>
        <DialogHeader>
          <DialogTitle>Renombrar conversación</DialogTitle>
          <DialogDescription>Un nombre corto para encontrarla en el historial.</DialogDescription>
        </DialogHeader>
        {conversation && <RenameForm key={conversation.id} conversation={conversation} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

// Borrar se lleva los mensajes y las propuestas; el gasto queda en el informe
// del mes.
export function AgentDeleteDialog({
  conversation,
  open,
  returnFocusTo,
  onClose,
  onDeleted,
}: {
  open: boolean;
  conversation: AgentConversationItem | null;
  returnFocusTo?: HTMLElement | null;
  onClose: () => void;
  onDeleted: (conversationId: string) => void;
}) {
  const { remove } = useAgentConversationMutations();
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={focusBack(returnFocusTo)}>
        <DialogHeader>
          <DialogTitle>¿Borrar la conversación?</DialogTitle>
          <DialogDescription>
            Se borran “{conversation?.title}”, sus mensajes y sus propuestas pendientes. El gasto ya
            hecho sigue en el informe de costos del mes. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="h-11 sm:h-9" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="h-11 sm:h-9"
            disabled={!conversation || remove.isPending}
            onClick={() => {
              if (!conversation) return;
              // La promesa (no el callback de mutate) corre aunque se cierre el
              // historial que contiene este diálogo: borrar la abierta arranca
              // una nueva igual. El error ya lo avisa el hook.
              remove.mutateAsync(conversation.id).then(
                () => {
                  onDeleted(conversation.id);
                  onClose();
                },
                () => undefined
              );
            }}
          >
            {remove.isPending ? "Borrando…" : "Borrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
