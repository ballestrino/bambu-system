"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { repeatBillingMonthAction, updateDraftInvoiceAction } from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { BillingMonthView } from "@/data/billing/month";
import type { DraftRow } from "@/lib/billing/billing-month-view";
import type { DraftInvoiceEdit } from "@/schemas/billing";

type RowEdit = Omit<DraftInvoiceEdit, "invoiceId" | "updatedAt">;

const patchRow = (client: QueryClient, periodKey: string, rowId: string, patch: (row: DraftRow) => DraftRow) =>
  client.setQueryData<BillingMonthView>(billingQueryKeys.month(periodKey), (view) =>
    view?.draft
      ? { ...view, draft: { ...view.draft, rows: view.draft.rows.map((row) => (row.id === rowId ? patch(row) : row)) } }
      : view
  );

const findRow = (client: QueryClient, periodKey: string, rowId: string) =>
  client.getQueryData<BillingMonthView>(billingQueryKeys.month(periodKey))?.draft?.rows.find((row) => row.id === rowId);

const applyEdit = (row: DraftRow, edit: RowEdit): DraftRow => ({
  ...row,
  selected: edit.selected ?? row.selected,
  lines: row.lines.map((line, index) => {
    const change = edit.lines?.find((item) => item.index === index);
    if (!change) return line;
    const precio = change.precio ?? line.precio;
    return { ...line, concepto: change.concepto ?? line.concepto, precio, subtotal: line.cantidad * precio };
  }),
});

export const useRepeatBillingMonth = (periodKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repeatBillingMonthAction(periodKey),
    onSuccess: (result) => {
      toast.success(result.success);
      return queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo repetir el mes"),
  });
};

// Los cambios de una fila salen de a uno (scope) y cada uno manda el
// updatedAt que dejó el anterior: el servidor rechaza uno viejo.
export const useDraftRowMutation = (periodKey: string, rowId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: billingQueryKeys.draftRowMutation,
    scope: { id: `billing-draft-${rowId}` },
    mutationFn: async (edit: RowEdit) => {
      const row = findRow(queryClient, periodKey, rowId);
      if (!row) throw new Error("La factura ya no está en el borrador");
      const result = await updateDraftInvoiceAction({ ...edit, invoiceId: rowId, updatedAt: row.updatedAt });
      patchRow(queryClient, periodKey, rowId, (current) => ({ ...current, updatedAt: result.updatedAt }));
      // El borrador recibe el mismo updatedAt: es lo que compara "Emitir".
      queryClient.setQueryData<BillingMonthView>(billingQueryKeys.month(periodKey), (view) =>
        view?.draft ? { ...view, draft: { ...view.draft, updatedAt: result.updatedAt } } : view
      );
      return result;
    },
    onMutate: async (edit) => {
      await queryClient.cancelQueries({ queryKey: billingQueryKeys.month(periodKey) });
      patchRow(queryClient, periodKey, rowId, (row) => applyEdit(row, edit));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el cambio");
      return queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) });
    },
    onSettled: (_data, error) =>
      error ? undefined : queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) }),
  });
};
