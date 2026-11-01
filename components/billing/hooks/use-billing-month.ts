"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { getBillingMonthAction, syncBillingMonthAction } from "@/components/billing/actions/billing-month.action";
import { billingQueryKeys } from "@/components/billing/query-keys";
import type { BillingMonthView } from "@/data/billing/month";

const ISSUING_POLL_MS = 1_500;
const DGI_POLL_MS = 20_000;

// Algo espera a DGI: lo emitido del mes en "Pendiente DGI" (también lo
// archivado) o una factura del borrador emitida o sin confirmar.
const isWaitingForDgi = (view: BillingMonthView | undefined) =>
  Boolean(
    view?.issued.some((row) => row.status === "ISSUED") ||
      view?.archived.some((row) => row.status === "ISSUED") ||
      view?.draft?.rows.some((row) => row.status === "ISSUED" || row.status === "UNKNOWN")
  );

// El mes desde la copia local y, al abrirlo, una sincronización con Biller
// (lo emitido desde su panel y el estado ante DGI). Cuando termina, se relee.
// Mientras se emite, el borrador se relee cada 1,5 s (el avance de cada
// factura); mientras algo espera a DGI, se sincroniza cada 20 s.
export const useBillingMonth = (periodKey: string) => {
  const queryClient = useQueryClient();

  const month = useQuery({
    queryKey: billingQueryKeys.month(periodKey),
    queryFn: () => getBillingMonthAction(periodKey),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.draft?.status === "ISSUING" ? ISSUING_POLL_MS : false),
    staleTime: 60_000,
  });

  const sync = useQuery({
    queryKey: billingQueryKeys.sync(periodKey),
    queryFn: () => syncBillingMonthAction(periodKey),
    refetchInterval: () =>
      isWaitingForDgi(queryClient.getQueryData<BillingMonthView>(billingQueryKeys.month(periodKey))) ? DGI_POLL_MS : false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (sync.dataUpdatedAt) {
      void queryClient.invalidateQueries({ queryKey: billingQueryKeys.month(periodKey) });
    }
  }, [periodKey, queryClient, sync.dataUpdatedAt]);

  // Al terminar una emisión, se sincroniza enseguida para traer el estado ante DGI.
  const draftStatus = month.data?.draft?.status;
  const previousStatus = useRef(draftStatus);
  const refetchSync = sync.refetch;
  useEffect(() => {
    if (previousStatus.current === "ISSUING" && draftStatus !== "ISSUING") void refetchSync();
    previousStatus.current = draftStatus;
  }, [draftStatus, refetchSync]);

  return { month, sync };
};
