"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getPendingVisits, summarizePendingVisits } from "@/lib/ops/pending-visits";
import { getDayKeyInstant, shiftDayKey } from "@/lib/ops/visit-calendar";
import { getVisitDayKey, getVisitsOfDay } from "@/lib/ops/visit-day";
import { resolvePendingVisitsAction } from "@/components/ops/actions/jobs/resolve-pending-visits.action";
import { showMutationError } from "@/components/ops/cache/mutation-toast";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { invalidateOccurrenceScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { useTodayKey } from "@/components/ops/hooks/useTodayKey";
import type { ResolvePendingVisitsInput } from "@/schemas/ops";

export const usePendingVisitsData = (
  query: ReturnType<typeof useJobOccurrences>,
  todayKey: string | null
) => {
  const visits = useMemo(
    () => (todayKey ? getPendingVisits(query.occurrences, todayKey) : []),
    [query.occurrences, todayKey]
  );
  const summary = useMemo(() => summarizePendingVisits(visits, todayKey ?? ""), [todayKey, visits]);
  const tomorrow = useMemo(
    () => todayKey
      ? getVisitsOfDay(query.occurrences, shiftDayKey(todayKey, 1)).filter((visit) => visit.status === "SCHEDULED")
      : [],
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

// Incluye mañana para el aviso de Inicio. Pendientes se calcula con el mismo
// día de Montevideo que usa el servidor al resolver un lote.
export const usePendingVisits = () => {
  const todayKey = useTodayKey(getVisitDayKey);
  const filters = useMemo(() => todayKey ? {
    endDate: new Date(getDayKeyInstant(shiftDayKey(todayKey, 2), 0).getTime() - 1),
    includeArchived: false,
    statuses: ["SCHEDULED" as const],
  } : undefined, [todayKey]);
  const query = useJobOccurrences(filters, "pending-visits", Boolean(todayKey));
  return usePendingVisitsData(query, todayKey);
};

export type PendingVisitsData = ReturnType<typeof usePendingVisitsData>;

export const usePendingVisitMutations = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: ResolvePendingVisitsInput) => resolvePendingVisitsAction(values),
    onSuccess: async (result) => {
      toast.success(`${result.success}: ${result.count}`);
      await invalidateOccurrenceScopes(queryClient);
    },
    onError: (error) => showMutationError(error, "No pudimos resolver las visitas"),
  });

  return { isResolving: mutation.isPending, resolve: mutation.mutateAsync };
};
