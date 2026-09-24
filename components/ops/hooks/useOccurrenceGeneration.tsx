"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  generateJobOccurrencesAction,
  previewJobOccurrenceGenerationAction,
} from "@/components/ops/actions/jobs/generate-job-occurrences.action";
import { showMutationError } from "@/components/ops/cache/mutation-toast";
import { invalidateVisitScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OccurrenceGenerationInput } from "@/schemas/ops";

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

// The preview only runs while the dialog is open: it reads, never writes.
export const useOccurrenceGenerationPreview = (
  input: OccurrenceGenerationInput,
  enabled: boolean
) =>
  useQuery({
    enabled,
    queryFn: () => previewJobOccurrenceGenerationAction(input),
    queryKey: opsQueryKeys.occurrenceGeneration(input),
    retry: false,
    staleTime: 0,
  });

export const useGenerateOccurrences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OccurrenceGenerationInput) => generateJobOccurrencesAction(input),
    onError: (error) => showMutationError(error, "No se pudieron generar las visitas"),
    onSuccess: ({ deleted, jobs, visits }) => {
      const created = visits
        ? `Se generaron ${plural(visits, "visita", "visitas")} de ${plural(jobs, "trabajo", "trabajos")}`
        : "No se generaron visitas";
      toast.success(
        deleted ? `${created} y se borraron ${plural(deleted, "visita", "visitas")} que no coincidían` : created
      );
      // Not awaited: the dialog closes as soon as the server answers.
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: opsQueryKeys.occurrenceRoot }),
        queryClient.invalidateQueries({ queryKey: opsQueryKeys.calendarRoot }),
        queryClient.invalidateQueries({ queryKey: opsQueryKeys.occurrenceGenerationRoot }),
        invalidateVisitScopes(queryClient),
      ]);
    },
  });
};
