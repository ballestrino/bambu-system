"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { setReceiverJobAction } from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";

// Vincular el receptor de una factura con su trabajo (o quitarlo). Al
// terminar se relee el mes: los avisos de todas las facturas de ese receptor.
export const useReceiverJob = (periodKey: string, invoiceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string | null) => {
      const result = await setReceiverJobAction({ invoiceId, jobId });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo guardar el vínculo"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) }),
  });
};
