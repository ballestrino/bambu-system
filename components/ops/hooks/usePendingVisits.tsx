"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getPendingVisits, summarizePendingVisits } from "@/lib/ops/pending-visits";
import { shiftDayKey } from "@/lib/ops/visit-calendar";
import { getVisitsOfDay } from "@/lib/ops/visit-day";
import { resolvePendingVisitsAction } from "@/components/ops/actions/jobs/resolve-pending-visits.action";
import { showMutationError } from "@/components/ops/cache/mutation-toast";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { invalidateOccurrenceScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { useTodayKey } from "@/components/ops/hooks/useTodayKey";
import { getPendingVisitsRange } from "@/components/ops/jobs/pending-visits-utils";
import type { ResolvePendingVisitsInput } from "@/schemas/ops";

// Programadas hasta mañana: alcanza para las pendientes (hoy y antes) y para
// decir cuantas hay mañana cuando todo esta al dia. La comparten Inicio y la
// vista Pendientes de Visitas.
export const usePendingVisits = (enabled = true) => {
  const todayKey = useTodayKey();
  const filters = useMemo(() => {
    const { endDate } = getPendingVisitsRange();
    return { endDate, includeArchived: false, statuses: ["SCHEDULED" as const] };
  }, []);
  const query = useJobOccurrences(filters, "pending-visits", enabled);

  const visits = useMemo(
    () => (todayKey ? getPendingVisits(query.occurrences, todayKey) : []),
    [query.occurrences, todayKey]
  );
  const summary = useMemo(() => summarizePendingVisits(visits, todayKey ?? ""), [todayKey, visits]);
  const tomorrow = useMemo(
    () => (todayKey ? getVisitsOfDay(query.occurrences, shiftDayKey(todayKey, 1)) : []),
    [query.occurrences, todayKey]
  );

  return {
    ...query,
    isLoading: query.isLoading || !todayKey,
    summary,
    todayKey,
    tomorrow,
    visits,
  };
};

export type PendingVisitsData = ReturnType<typeof usePendingVisits>;

export const usePendingVisitMutations = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: ResolvePendingVisitsInput) => resolvePendingVisitsAction(values),
    onSuccess: (result) => {
      toast.success(`${result.success}: ${result.count}`);
      void invalidateOccurrenceScopes(queryClient);
    },
    onError: (error) => showMutationError(error, "No pudimos resolver las visitas"),
  });

  return { isResolving: mutation.isPending, resolve: mutation.mutateAsync };
};
