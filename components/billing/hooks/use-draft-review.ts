"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteDraftInvoiceAction,
  reviewBillingDraftAction,
  updateDraftInvoiceAction,
} from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { BillingMonthView } from "@/data/billing/month";
import type { ReviewSuggestion } from "@/lib/billing/draft-review";

// "Revisar con IA" (52): pide las sugerencias. No cambia nada del borrador.
export const useDraftReview = (periodKey: string) =>
  useMutation({
    mutationFn: async () => {
      const result = await reviewBillingDraftAction(periodKey);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "La revisión con IA no respondió"),
  });

// Aplicar una sugerencia con las acciones de siempre y el updatedAt actual de
// la fila (compare-and-set). Va en la cola de los cambios del borrador, así
// "Emitir" espera. Después relee el mes: la próxima toma el updatedAt nuevo.
export const useApplyReviewSuggestion = (periodKey: string) => {
  const queryClient = useQueryClient();
  const monthKey = billingQueryKeys.month(periodKey);
  return useMutation({
    mutationKey: billingQueryKeys.draftRowMutation,
    scope: { id: `billing-draft-review-${periodKey}` },
    mutationFn: async (suggestion: ReviewSuggestion) => {
      const row = queryClient.getQueryData<BillingMonthView>(monthKey)?.draft?.rows.find((item) => item.id === suggestion.invoiceId);
      if (!row || row.status !== "DRAFT") throw new Error(`La factura de ${suggestion.name} ya no está en el borrador`);
      const base = { invoiceId: row.id, updatedAt: row.updatedAt };
      if (suggestion.kind === "remove") {
        const result = await deleteDraftInvoiceAction(base);
        if ("error" in result) throw new Error(result.error);
      } else if (suggestion.kind === "adenda") {
        await updateDraftInvoiceAction({ ...base, adenda: suggestion.proposed });
      } else if (suggestion.kind === "concepto" && suggestion.lineIndex !== null && suggestion.proposed) {
        await updateDraftInvoiceAction({ ...base, lines: [{ concepto: suggestion.proposed, index: suggestion.lineIndex }] });
      }
      await queryClient.refetchQueries({ queryKey: monthKey });
      return suggestion;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo aplicar");
      return queryClient.invalidateQueries({ queryKey: monthKey });
    },
  });
};
