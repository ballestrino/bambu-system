"use client";

import { useState } from "react";

import {
  AgentDeleteDialog,
  AgentRenameDialog,
  type ConversationRef,
} from "@/components/agent/agent-conversation-dialogs";
import type { ConversationAction } from "@/components/agent/agent-conversation-menu";
import { useAgentConversationMutations } from "@/components/agent/hooks/use-agent-conversation-mutations";

// El diálogo abierto. Cerrar solo apaga open: la conversación y el botón
// siguen hasta que Radix termina de cerrar y le devuelve el foco al botón.
type OpenDialog = {
  kind: "rename" | "delete";
  conversation: ConversationRef;
  trigger: HTMLElement | null;
  open: boolean;
};

// Fijar, renombrar y borrar una conversación desde su menú (el "…" de una fila
// o de la cabecera) o deslizando la fila en el teléfono. Fijar se aplica en el
// momento; renombrar y borrar abren su diálogo, que va en dialogs.
export const useConversationActions = (onDeleted: (conversationId: string) => void) => {
  const { pin } = useAgentConversationMutations();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const close = () => setDialog((current) => current && { ...current, open: false });
  const dialogFor = (kind: OpenDialog["kind"]) => ({
    open: dialog?.kind === kind && dialog.open,
    conversation: dialog?.kind === kind ? dialog.conversation : null,
    returnFocusTo: dialog?.trigger,
    onClose: close,
  });

  const run = (
    conversation: ConversationRef & { pinnedAt: string | null },
    action: ConversationAction,
    trigger: HTMLElement | null = null
  ) => {
    if (action === "pin") pin.mutate({ id: conversation.id, pinned: !conversation.pinnedAt });
    else setDialog({ kind: action, conversation, trigger, open: true });
  };

  const dialogs = (
    <>
      <AgentRenameDialog {...dialogFor("rename")} />
      <AgentDeleteDialog {...dialogFor("delete")} onDeleted={onDeleted} />
    </>
  );

  return { run, dialogs };
};
