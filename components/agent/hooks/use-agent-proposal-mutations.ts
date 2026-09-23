"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  confirmProposalAction,
  rejectProposalAction,
} from "@/components/agent/actions/agent-writes.action";
import { agentKeys } from "@/components/agent/query-keys";
import { officialBudgetKeys } from "@/components/official-budgets/query-keys";
import type { ProposalResult } from "@/lib/agent/proposals";

// Confirmar ejecuta la escritura con las acciones existentes; rechazar solo
// cierra la propuesta. Las dos releen el estado vivo al terminar, aunque
// fallen: una propuesta vieja o vencida cambia de estado igual.
export const useAgentProposalMutations = ({
  conversationId,
  onConfirmed,
}: {
  conversationId: string;
  onConfirmed?: (result: ProposalResult | null) => void;
}) => {
  const queryClient = useQueryClient();
  const refreshProposals = () =>
    queryClient.invalidateQueries({ queryKey: agentKeys.proposals(conversationId) });
  const showError = (error: Error) => toast.error(error.message);

  const confirm = useMutation({
    mutationFn: confirmProposalAction,
    onSuccess: async (outcome) => {
      toast.success(outcome.message);
      // Primero el host (puede redirigir si cambió la dirección del
      // presupuesto abierto), después las listas y el detalle.
      onConfirmed?.(outcome.result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["budget"] }),
        queryClient.invalidateQueries({ queryKey: officialBudgetKeys.all }),
      ]);
    },
    onError: showError,
    onSettled: refreshProposals,
  });

  const reject = useMutation({
    mutationFn: rejectProposalAction,
    onSuccess: (message) => toast.success(message),
    onError: showError,
    onSettled: refreshProposals,
  });

  return { confirm, reject };
};
