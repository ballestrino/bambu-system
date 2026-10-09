"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteConversationAction,
  pinConversationAction,
  renameConversationAction,
  setConversationModeAction,
} from "@/components/agent/actions/agent-writes.action";
import { agentKeys } from "@/components/agent/query-keys";
import type { AgentConversationItem } from "@/components/agent/types";

// Renombrar, fijar, borrar y cambiar el modo de una conversación del
// historial.
export const useAgentConversationMutations = () => {
  const queryClient = useQueryClient();
  const refreshLists = () => queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
  const showError = (error: Error) => toast.error(error.message);

  const rename = useMutation({
    mutationFn: renameConversationAction,
    onSuccess: async (message) => {
      toast.success(message);
      await refreshLists();
    },
    onError: showError,
  });

  // El consumo de una conversación borrada queda en el informe del mes.
  const remove = useMutation({
    mutationFn: deleteConversationAction,
    onSuccess: async (message, conversationId) => {
      toast.success(message);
      queryClient.removeQueries({ queryKey: agentKeys.conversation(conversationId) });
      await Promise.all([
        refreshLists(),
        queryClient.invalidateQueries({ queryKey: agentKeys.monthlyUsages() }),
      ]);
    },
    onError: showError,
  });

  // Fijar se ve en el momento: las listas cargadas cambian antes de que
  // responda el servidor, y vuelven a leerse al terminar (bien o mal).
  const pin = useMutation({
    mutationFn: pinConversationAction,
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: agentKeys.conversations() });
      const pinnedAt = pinned ? new Date().toISOString() : null;
      queryClient.setQueriesData<AgentConversationItem[]>({ queryKey: agentKeys.conversations() }, (list) =>
        list?.map((item) => (item.id === id ? { ...item, pinnedAt } : item))
      );
    },
    onError: showError,
    onSettled: refreshLists,
  });

  const setMode = useMutation({
    mutationFn: setConversationModeAction,
    onSuccess: refreshLists,
    onError: showError,
  });

  return { rename, pin, remove, setMode };
};
