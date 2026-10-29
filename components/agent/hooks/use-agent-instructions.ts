"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listInstructionVersionsAction,
  restoreInstructionsAction,
} from "@/components/agent/actions/agent-instructions.action";
import { agentKeys } from "@/components/agent/query-keys";

// Las versiones de las instrucciones del equipo y restaurar una. Restaurar
// relee la lista al terminar, aunque falle: otra versión pudo haber entrado.
export const useAgentInstructions = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: agentKeys.instructions(), queryFn: listInstructionVersionsAction });
  const restore = useMutation({
    mutationFn: restoreInstructionsAction,
    onSuccess: (message) => toast.success(message),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: agentKeys.instructions() }),
  });
  return { query, restore };
};
