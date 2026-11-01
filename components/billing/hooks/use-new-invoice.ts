"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  issueNewInvoiceAction,
  lookupBillingRutAction,
  saveNewInvoiceToDraftAction,
  searchBillingClientsAction,
  type NewInvoiceResult,
} from "@/components/billing/actions/new-invoice.action";
import { billingQueryKeys } from "@/components/billing/query-keys";

const SEARCH_DELAY_MS = 250;

// Un { error } es un error del pedido, salvo una factura sin confirmar: esa
// vuelve como resultado para ofrecer "Reintentar".
const orThrow = async (pending: Promise<NewInvoiceResult>) => {
  const result = await pending;
  if (result.error && !result.unknown) throw new Error(result.error);
  return result;
};

// Emitir ahora y guardar en el borrador. Al terminar se releen los meses de
// Facturación (la factura aparece en Emitidas o en el borrador).
export const useNewInvoice = () => {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: billingQueryKeys.root });
  const issue = useMutation({ mutationFn: (values: unknown) => orThrow(issueNewInvoiceAction(values)), onSettled: refresh });
  const save = useMutation({
    mutationFn: (values: unknown) => orThrow(saveNewInvoiceToDraftAction(values)),
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar en el borrador"),
    onSettled: refresh,
  });
  return { issue, save };
};

// "Buscar cliente": los receptores de facturas anteriores, con una pausa
// corta mientras se escribe.
export const useBillingClientSearch = (query: string) => {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);
  return useQuery({
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await searchBillingClientsAction(debounced);
      if (result.error) throw new Error(result.error);
      return result.clients;
    },
    queryKey: billingQueryKeys.clients(debounced),
    staleTime: 60_000,
  });
};

// "Consultar DGI": razón social y domicilio fiscal del RUT.
export const useRutLookup = () =>
  useMutation({
    mutationFn: async (rut: string) => {
      const result = await lookupBillingRutAction(rut);
      if (!result.data) throw new Error(result.error ?? "No se pudo consultar el RUT");
      return result.data;
    },
    onError: (error: Error) => toast.error(error.message),
  });
