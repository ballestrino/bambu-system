"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteDraftInvoiceAction, setInvoiceArchivedAction } from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { BillingMonthView } from "@/data/billing/month";

// Borrar una factura del borrador (47). Va en la misma cola que los cambios
// de la fila (scope) y manda el último updatedAt; usa la misma mutationKey,
// así "Emitir" espera a que termine. Al borrar, la fila sale y el borrador
// toma el updatedAt nuevo del lote.
export const useDeleteDraftInvoice = (periodKey: string, rowId: string) => {
  const queryClient = useQueryClient();
  const monthKey = billingQueryKeys.month(periodKey);
  return useMutation({
    mutationKey: billingQueryKeys.draftRowMutation,
    scope: { id: `billing-draft-${rowId}` },
    mutationFn: async () => {
      const row = queryClient.getQueryData<BillingMonthView>(monthKey)?.draft?.rows.find((item) => item.id === rowId);
      if (!row) throw new Error("La factura ya no está en el borrador");
      const result = await deleteDraftInvoiceAction({ invoiceId: rowId, updatedAt: row.updatedAt });
      if ("error" in result) throw new Error(result.error);
      queryClient.setQueryData<BillingMonthView>(monthKey, (view) =>
        view?.draft
          ? {
              ...view,
              draft: { ...view.draft, rows: view.draft.rows.filter((item) => item.id !== rowId), updatedAt: result.batchUpdatedAt },
            }
          : view
      );
      return result;
    },
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(error instanceof Error ? error.message : "No pudimos borrar la factura"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: monthKey }),
  });
};

// Archivar o desarchivar una emitida (47). Archivar ofrece "Deshacer".
export const useArchiveInvoice = (periodKey: string) => {
  const queryClient = useQueryClient();
  const monthKey = billingQueryKeys.month(periodKey);
  const mutation = useMutation({
    mutationFn: async ({ archived, invoiceId }: { archived: boolean; invoiceId: string }) => {
      const result = await setInvoiceArchivedAction({ archived, invoiceId });
      if ("error" in result) throw new Error(result.error);
      return { ...result, invoiceId };
    },
    onSuccess: (result) =>
      result.archived
        ? toast.success(result.success, {
            action: { label: "Deshacer", onClick: () => mutation.mutate({ archived: false, invoiceId: result.invoiceId }) },
          })
        : toast.success(result.success),
    onError: (error) => toast.error(error instanceof Error ? error.message : "No pudimos cambiar la factura"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: monthKey }),
  });
  return mutation;
};
