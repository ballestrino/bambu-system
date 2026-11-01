"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { issueCreditNoteAction, retryCreditNoteAction, type CreditNoteResult } from "@/components/billing/actions/credit-note.action";
import { billingQueryKeys } from "@/components/billing/query-keys";

// Un { error } es un error del pedido, salvo una nota sin confirmar: esa
// vuelve como resultado para ofrecer "Reintentar".
const orThrow = async (pending: Promise<CreditNoteResult>) => {
  const result = await pending;
  if (result.error && !result.unknown) throw new Error(result.error);
  return result;
};

// Emitir la nota (o reintentar una sin confirmar). Al terminar, bien o mal,
// se relee la página (la factura y sus notas) y los meses de Facturación.
export const useCreditNote = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const refresh = async () => {
    router.refresh();
    await queryClient.invalidateQueries({ queryKey: billingQueryKeys.root });
  };
  const notify = (result: CreditNoteResult) => {
    if (result.success) toast.success(result.success);
    else if (result.error) toast.warning(result.error);
  };
  const onError = (error: Error) => toast.error(error.message || "No se pudo emitir la nota");

  const issue = useMutation({ mutationFn: (values: unknown) => orThrow(issueCreditNoteAction(values)), onError, onSettled: refresh, onSuccess: notify });
  const retry = useMutation({ mutationFn: (noteId: string) => orThrow(retryCreditNoteAction(noteId)), onError, onSettled: refresh, onSuccess: notify });
  return { issue, retry };
};
