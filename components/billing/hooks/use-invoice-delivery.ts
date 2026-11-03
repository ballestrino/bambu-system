"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteInvoiceDeliveryAction,
  recordInvoiceDeliveryAction,
  sendInvoiceEmailAction,
} from "@/components/billing/actions/invoice-delivery.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { InvoiceDeliveryAdd, InvoiceSendRequest } from "@/schemas/billing-delivery";

const unwrap = <T extends object>(result: T) => {
  if ("error" in result && typeof result.error === "string") throw new Error(result.error);
  return result as Exclude<T, { error: string }> & { success?: string };
};

const message = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

// Enviar por correo, anotar y quitar una anotación (feature 53). Al terminar
// se relee el mes: la fila muestra los íconos y el registro nuevo.
export const useInvoiceDelivery = (periodKey: string) => {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) });

  const send = useMutation({
    mutationFn: async (values: InvoiceSendRequest) => unwrap(await sendInvoiceEmailAction(values)),
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(message(error, "No se pudo enviar el correo")),
    onSettled: refresh,
  });

  const record = useMutation({
    mutationFn: async (values: InvoiceDeliveryAdd) => unwrap(await recordInvoiceDeliveryAction(values)),
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(message(error, "No se pudo anotar el envío")),
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: async (deliveryId: string) => unwrap(await deleteInvoiceDeliveryAction({ deliveryId })),
    onSuccess: (result) => toast.success(result.success),
    onError: (error) => toast.error(message(error, "No se pudo quitar la anotación")),
    onSettled: refresh,
  });

  return { record, remove, send };
};
