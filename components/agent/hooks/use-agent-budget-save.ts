"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BudgetFieldError, saveBudgetAction } from "@/components/agent/actions/agent-writes.action";
import { agentKeys } from "@/components/agent/query-keys";

// Guardar en el generador desde el editor. Un error del nombre lo marca el
// formulario; el resto va en un toast. Bien o mal, se relee el estado vivo de
// las propuestas: la tarjeta pasa a guardada o dice por qué falló.
export const useAgentBudgetSave = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBudgetAction,
    onSuccess: async (outcome) => {
      toast.success(outcome.result ? `Guardado en el generador: ${outcome.result.label}` : outcome.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["budget"] }),
      ]);
    },
    onError: (error) => {
      if (!(error instanceof BudgetFieldError)) toast.error(error.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: agentKeys.proposals(conversationId) }),
  });
};
