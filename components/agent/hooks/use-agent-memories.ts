"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteMemoryAction,
  expireMemoryAction,
  listMemoriesAction,
  updateMemoryAction,
} from "@/components/agent/actions/agent-memory.action";
import { agentKeys } from "@/components/agent/query-keys";

// La memoria del equipo y sus escrituras. Cada una relee la lista al
// terminar, aunque falle: otra persona pudo haberla cambiado.
export const useAgentMemories = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: agentKeys.memories(), queryFn: listMemoriesAction });
  const options = {
    onSuccess: (message: string) => toast.success(message),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: agentKeys.memories() }),
  };

  return {
    query,
    update: useMutation({ mutationFn: updateMemoryAction, ...options }),
    expire: useMutation({ mutationFn: expireMemoryAction, ...options }),
    remove: useMutation({ mutationFn: deleteMemoryAction, ...options }),
  };
};

export type AgentMemoryMutations = Omit<ReturnType<typeof useAgentMemories>, "query">;
