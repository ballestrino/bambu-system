"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { issueBillingBatchAction, resumeBillingIssueAction } from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { IssueBatchRequest } from "@/schemas/billing";

// "Emitir N" y "Continuar". La respuesta llega apenas el servidor toma el
// borrador; el avance se ve releyendo el mes. Ante un rechazo (el borrador
// cambió) también se relee, así la página muestra el borrador nuevo.
export const useIssueBillingBatch = (periodKey: string) => {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) });
  return useMutation({
    mutationFn: (request: IssueBatchRequest) => issueBillingBatchAction(request),
    onSuccess: async (result) => {
      toast.success(result.success);
      await refresh();
    },
    onError: async (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo emitir");
      await refresh();
    },
  });
};

export const useResumeBillingIssue = (periodKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => resumeBillingIssueAction(batchId),
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo reintentar"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) }),
  });
};
