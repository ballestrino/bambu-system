"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobOccurrenceAction } from "@/components/ops/actions/jobs/archive-job-occurrence.action";
import { createJobOccurrenceAction } from "@/components/ops/actions/jobs/create-job-occurrence.action";
import { detachJobOccurrenceAction } from "@/components/ops/actions/jobs/detach-job-occurrence.action";
import { updateJobOccurrenceAction } from "@/components/ops/actions/jobs/update-job-occurrence.action";
import {
  patchListItem,
  reconcileListItem,
  restoreSnapshots,
  snapshotQueries,
} from "@/components/ops/cache/optimistic-cache";
import {
  matchesOccurrenceFilters,
  sortOccurrences,
} from "@/components/ops/cache/optimistic-filters";
import {
  buildOptimisticOccurrence,
  patchOptimisticOccurrence,
} from "@/components/ops/cache/optimistic-occurrences";
import {
  showMutationError,
  stripMutationErrorAction,
  type MutationErrorAction,
} from "@/components/ops/cache/mutation-toast";
import { opsQueryKeys } from "@/components/ops/query-keys";
import { invalidateVisitScopes } from "@/components/ops/hooks/useOpsInvalidation";
import type { OpsOccurrence } from "@/components/ops/types";
import type {
  CreateJobOccurrenceInput,
  DetachJobOccurrenceInput,
  UpdateJobOccurrenceInput,
} from "@/schemas/ops";

const occurrenceRoots = [opsQueryKeys.occurrenceRoot, opsQueryKeys.calendarRoot];

type ArchiveOccurrenceArgs =
  | string
  | { occurrenceId: string; successMessage?: string };

const getArchiveOccurrenceId = (args: ArchiveOccurrenceArgs) =>
  typeof args === "string" ? args : args.occurrenceId;

export const useJobOccurrenceMutations = (_jobId?: string) => {
  void _jobId;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (values: CreateJobOccurrenceInput & MutationErrorAction) =>
      createJobOccurrenceAction(stripMutationErrorAction(values)),
    onMutate: async (values) => {
      const snapshots = await snapshotQueries(queryClient, occurrenceRoots);
      const optimisticOccurrence = buildOptimisticOccurrence(queryClient, values);
      reconcileListItem(queryClient, opsQueryKeys.occurrenceRoot, optimisticOccurrence, {
        matches: matchesOccurrenceFilters,
        sort: sortOccurrences,
      });
      return { optimisticId: optimisticOccurrence.id, snapshots };
    },
    onSuccess: (occurrence, _values, context) => {
      if (!occurrence) return;
      reconcileListItem(queryClient, opsQueryKeys.occurrenceRoot, occurrence, {
        matches: matchesOccurrenceFilters,
        sort: sortOccurrences,
        tempId: context?.optimisticId,
      });
      void invalidateVisitScopes(queryClient);
      toast.success("Ocurrencia creada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al crear la ocurrencia", values.onErrorAction);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ occurrenceId, values }: { occurrenceId: string; values: UpdateJobOccurrenceInput } & MutationErrorAction) =>
      updateJobOccurrenceAction(occurrenceId, values),
    onMutate: async ({ occurrenceId, values }) => {
      const snapshots = await snapshotQueries(queryClient, occurrenceRoots);
      patchListItem<OpsOccurrence>(
        queryClient,
        opsQueryKeys.occurrenceRoot,
        occurrenceId,
        patchOptimisticOccurrence(queryClient, values),
        { matches: matchesOccurrenceFilters, sort: sortOccurrences }
      );
      return { snapshots };
    },
    onSuccess: (occurrence) => {
      if (!occurrence) return;
      reconcileListItem(queryClient, opsQueryKeys.occurrenceRoot, occurrence, {
        matches: matchesOccurrenceFilters,
        sort: sortOccurrences,
      });
      void invalidateVisitScopes(queryClient);
      toast.success("Ocurrencia actualizada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al actualizar la ocurrencia", values.onErrorAction);
    },
  });

  const detachMutation = useMutation({
    mutationFn: ({ occurrenceId, values }: { occurrenceId: string; values?: DetachJobOccurrenceInput } & MutationErrorAction) =>
      detachJobOccurrenceAction(occurrenceId, values),
    onMutate: async ({ occurrenceId, values }) => {
      const snapshots = await snapshotQueries(queryClient, occurrenceRoots);
      patchListItem<OpsOccurrence>(
        queryClient,
        opsQueryKeys.occurrenceRoot,
        occurrenceId,
        patchOptimisticOccurrence(queryClient, { ...values, isDetached: true, scheduleRuleId: null }),
        { matches: matchesOccurrenceFilters, sort: sortOccurrences }
      );
      return { snapshots };
    },
    onSuccess: (occurrence) => {
      if (!occurrence) return;
      reconcileListItem(queryClient, opsQueryKeys.occurrenceRoot, occurrence, {
        matches: matchesOccurrenceFilters,
        sort: sortOccurrences,
      });
      void invalidateVisitScopes(queryClient);
      toast.success("Ocurrencia separada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al separar la ocurrencia", values.onErrorAction);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (args: ArchiveOccurrenceArgs) =>
      archiveJobOccurrenceAction(getArchiveOccurrenceId(args)),
    onMutate: async (args) => {
      const occurrenceId = getArchiveOccurrenceId(args);
      const snapshots = await snapshotQueries(queryClient, occurrenceRoots);
      patchListItem<OpsOccurrence>(
        queryClient,
        opsQueryKeys.occurrenceRoot,
        occurrenceId,
        (occurrence) => ({ ...occurrence, archivedAt: new Date(), updatedAt: new Date() }),
        { matches: matchesOccurrenceFilters, sort: sortOccurrences }
      );
      return { snapshots };
    },
    onSuccess: (occurrence, args) => {
      if (!occurrence) return;
      reconcileListItem(queryClient, opsQueryKeys.occurrenceRoot, occurrence, {
        matches: matchesOccurrenceFilters,
        sort: sortOccurrences,
      });
      void invalidateVisitScopes(queryClient);
      toast.success(
        typeof args === "string"
          ? "Ocurrencia archivada"
          : args.successMessage ?? "Ocurrencia archivada"
      );
    },
    onError: (error, _occurrenceId, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al archivar la ocurrencia");
    },
  });

  return {
    createOccurrenceAsync: createMutation.mutateAsync,
    updateOccurrenceAsync: updateMutation.mutateAsync,
    detachOccurrenceAsync: detachMutation.mutateAsync,
    archiveOccurrenceAsync: archiveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDetaching: detachMutation.isPending,
    isArchiving: archiveMutation.isPending,
  };
};
