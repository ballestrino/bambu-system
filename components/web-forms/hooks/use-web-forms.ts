"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listWebFormsAction,
  newWebFormsCountAction,
  replyWebFormAction,
  setWebFormStatusAction,
  webFormDetailAction,
} from "@/components/web-forms/actions/web-forms.action";
import type { ListWebFormsInput } from "@/schemas/web-forms";

export const webFormKeys = {
  all: ["web-forms"] as const,
  list: (filters: ListWebFormsInput) => [...webFormKeys.all, "list", filters] as const,
  detail: (id: string) => [...webFormKeys.all, "detail", id] as const,
  newCount: () => [...webFormKeys.all, "new-count"] as const,
};

// Cada minuto, mientras la pestaña está a la vista: llegan solos desde la web.
const POLL_MS = 60_000;

export const useWebFormList = (filters: ListWebFormsInput) =>
  useQuery({
    queryKey: webFormKeys.list(filters),
    queryFn: () => listWebFormsAction(filters),
    placeholderData: keepPreviousData,
    refetchInterval: POLL_MS,
  });

export const useWebFormDetail = (id: string | null) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: webFormKeys.detail(id ?? ""),
    queryFn: async () => {
      const form = await webFormDetailAction(id ?? "");
      // Recién marcado como leído: la lista cambia (el punto de no leído).
      if (form.readAt && Date.now() - new Date(form.readAt).getTime() < 10_000) {
        queryClient.invalidateQueries({ queryKey: [...webFormKeys.all, "list"] });
      }
      return form;
    },
    enabled: Boolean(id),
  });
};

export const useNewWebFormsCount = () =>
  useQuery({ queryKey: webFormKeys.newCount(), queryFn: newWebFormsCountAction, refetchInterval: POLL_MS });

// Las escrituras releen todo al terminar, aunque fallen: otra persona pudo
// haberlo cambiado.
export const useWebFormMutations = () => {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: webFormKeys.all });
  const onError = (error: Error) => toast.error(error.message);

  return {
    setStatus: useMutation({
      mutationFn: setWebFormStatusAction,
      onSuccess: (message: string) => toast.success(message),
      onError,
      onSettled,
    }),
    reply: useMutation({
      mutationFn: replyWebFormAction,
      onSuccess: (result) => (result.savedToSent === false ? toast.warning(result.success) : toast.success(result.success)),
      onError,
      onSettled,
    }),
  };
};
