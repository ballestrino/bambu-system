"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteConversationAction,
  renameConversationAction,
  setConversationModeAction,
} from "@/components/agent/actions/agent-writes.action";
import { agentKeys } from "@/components/agent/query-keys";

// Renombrar, borrar y cambiar el modo de una conversación del historial.
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

  const setMode = useMutation({
    mutationFn: setConversationModeAction,
    onSuccess: refreshLists,
    onError: showError,
  });

  return { rename, remove, setMode };
};
