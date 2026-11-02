"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { setInvoiceLabelAction } from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";

// El título interno de un consumidor final (51). Al terminar se relee el
// mes: el nombre de la fila y el trabajo que le corresponde a ese título.
export const useInvoiceLabel = (periodKey: string, invoiceId: string, updatedAt: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string | null) => {
      const result = await setInvoiceLabelAction({ invoiceId, label, updatedAt });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo guardar el título"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) }),
  });
};
