"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  confirmProposalAction,
  rejectProposalAction,
} from "@/components/agent/actions/agent-writes.action";
import { agentKeys } from "@/components/agent/query-keys";
import { invalidateBudgetScopes } from "@/components/budgets/hooks/budget-cache";
import { invalidateOccurrenceScopes } from "@/components/ops/hooks/useOpsInvalidation";
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
  // El historial también: cuenta las pendientes de cada conversación.
  const refreshProposals = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: agentKeys.proposals(conversationId) }),
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations() }),
    ]);
  const showError = (error: Error) => toast.error(error.message);

  const confirm = useMutation({
    mutationFn: confirmProposalAction,
    onSuccess: async (outcome) => {
      toast.success(outcome.message);
      // Primero el host (puede redirigir si cambió la dirección del
      // presupuesto abierto), después las listas y el detalle.
      onConfirmed?.(outcome.result);
      // Una de visitas trae occurrenceIds, una de memoria memoryId y una de
      // reglas instructionVersion. Sin
      // resultado (borraron la conversación) no se sabe cuál fue: se releen todas.
      const visits = Boolean(outcome.result?.occurrenceIds);
      const memory = Boolean(outcome.result?.memoryId);
      const instructions = Boolean(outcome.result?.instructionVersion);
      const budgets = !visits && !memory && !instructions;
      await Promise.all([
        memory || !outcome.result ? queryClient.invalidateQueries({ queryKey: agentKeys.memories() }) : null,
        instructions || !outcome.result ? queryClient.invalidateQueries({ queryKey: agentKeys.instructions() }) : null,
        budgets ? invalidateBudgetScopes(queryClient) : null,
        budgets ? queryClient.invalidateQueries({ queryKey: officialBudgetKeys.all }) : null,
        visits || !outcome.result ? invalidateOccurrenceScopes(queryClient) : null,
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

  // Confirmar varias (la tarjeta de confirmar todas): de a una, cada una con
  // su acción, sus avisos y su toast; si una falla, sigue con las demás.
  const [confirmingAll, setConfirmingAll] = useState(false);
  // Un lote de visitas va con las marcadas en su tarjeta.
  const confirmAll = async (items: { proposalId: string; visitIndexes?: number[] }[]) => {
    setConfirmingAll(true);
    try {
      for (const item of items) {
        await confirm.mutateAsync(item).catch(() => null);
      }
    } finally {
      setConfirmingAll(false);
    }
  };

  return { confirm, reject, confirmAll, confirmingAll };
};
