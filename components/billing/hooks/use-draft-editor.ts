"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  loadDraftInvoiceEditorAction,
  saveDraftInvoiceFormAction,
  setDraftInvoiceSelectedAction,
} from "@/components/billing/actions/draft-editor.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { BillingMonthView } from "@/data/billing/month";
import type { DraftInvoiceEditorView } from "@/data/billing/draft-invoice";
import type { NewInvoiceForm } from "@/lib/billing/new-invoice";

// El editor lateral (feature 49): la factura entera, leída aparte del mes.
export const useDraftInvoiceEditor = (invoiceId: string | null) =>
  useQuery({
    enabled: Boolean(invoiceId),
    queryKey: billingQueryKeys.draftInvoice(invoiceId ?? ""),
    queryFn: async () => {
      const result = await loadDraftInvoiceEditorAction(invoiceId!);
      if ("error" in result) throw new Error(result.error);
      return result as DraftInvoiceEditorView;
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 0,
  });

// La fila y el borrador toman el updatedAt nuevo enseguida: "Emitir" (en la
// barra o en el diálogo abierto detrás) compara contra ese y no rechaza el
// cambio propio. Después se relee el mes y la factura.
const settle = async (client: QueryClient, periodKey: string, invoiceId: string, patch: { selected?: boolean; total?: number; updatedAt: string }) => {
  client.setQueryData<BillingMonthView>(billingQueryKeys.month(periodKey), (view) =>
    view?.draft
      ? {
          ...view,
          draft: {
            ...view.draft,
            rows: view.draft.rows.map((row) => (row.id === invoiceId ? { ...row, ...patch } : row)),
            updatedAt: patch.updatedAt,
          },
        }
      : view
  );
  await Promise.all([
    client.invalidateQueries({ queryKey: billingQueryKeys.draftInvoice(invoiceId) }),
    client.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) }),
  ]);
};

// Guardar y marcar o desmarcar van en la misma cola que los cambios de la
// fila (scope) y con la misma mutationKey: "Emitir" espera a que terminen.
// Si alguien cambió la factura (el agente, otra pestaña), se relee y el
// editor muestra la versión nueva.
export const useDraftEditorMutations = (periodKey: string, invoiceId: string) => {
  const client = useQueryClient();
  const reload = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: billingQueryKeys.draftInvoice(invoiceId) }),
      client.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) }),
    ]);
  const common = {
    mutationKey: billingQueryKeys.draftRowMutation,
    scope: { id: `billing-draft-${invoiceId}` },
    onError: (error: Error) => toast.error(error.message || "No pudimos guardar la factura"),
  };

  const save = useMutation({
    ...common,
    mutationFn: async ({ form, updatedAt }: { form: NewInvoiceForm; updatedAt: string }) => {
      const result = await saveDraftInvoiceFormAction({ form, invoiceId, updatedAt });
      if ("error" in result) {
        if (result.conflict) await reload();
        throw new Error(result.error);
      }
      if (result.changes.length) await settle(client, periodKey, invoiceId, { total: result.total, updatedAt: result.updatedAt });
      return result;
    },
    onSuccess: (result) => toast.success(result.success),
  });

  const select = useMutation({
    ...common,
    mutationFn: async ({ selected, updatedAt }: { selected: boolean; updatedAt: string }) => {
      const result = await setDraftInvoiceSelectedAction({ invoiceId, selected, updatedAt });
      if ("error" in result) {
        if (result.conflict) await reload();
        throw new Error(result.error);
      }
      await settle(client, periodKey, invoiceId, { selected, updatedAt: result.updatedAt });
      return selected;
    },
    onSuccess: (selected) => toast.success(selected ? "Vuelve a ir en el borrador" : "Quitada: no se emite este mes"),
  });

  return { save, select };
};
