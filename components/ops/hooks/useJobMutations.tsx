"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobAction } from "@/components/ops/actions/jobs/archive-job.action";
import { createJobAction } from "@/components/ops/actions/jobs/create-job.action";
import { updateJobAction } from "@/components/ops/actions/jobs/update-job.action";
import {
  getOptimisticId,
  optimisticAuditUser,
  patchListItem,
  reconcileListItem,
  restoreSnapshots,
  snapshotQueries,
  upsertDetail,
} from "@/components/ops/cache/optimistic-cache";
import {
  matchesJobFilters,
  sortJobs,
} from "@/components/ops/cache/optimistic-filters";
import {
  showMutationError,
  stripMutationErrorAction,
  type MutationErrorAction,
} from "@/components/ops/cache/mutation-toast";
import { opsQueryKeys } from "@/components/ops/query-keys";
import { invalidateVisitScopes } from "@/components/ops/hooks/useOpsInvalidation";
import type { OpsJobListItem } from "@/components/ops/types";
import type { CreateJobInput, UpdateJobInput } from "@/schemas/ops";

const jobRoots = [opsQueryKeys.jobs, opsQueryKeys.occurrenceRoot, opsQueryKeys.calendarRoot];

const buildOptimisticJob = (values: CreateJobInput): OpsJobListItem => {
  const now = new Date();

  return {
    ...values,
    id: getOptimisticId("job"),
    archivedAt: null,
    budgetSnapshot: null,
    createdAt: now,
    createdBy: optimisticAuditUser,
    createdById: optimisticAuditUser.id,
    punctualEndDate: values.punctualEndDate ?? null,
    punctualStartDate: values.punctualStartDate ?? null,
    sourceBudget: null,
    sourceBudgetId: values.sourceBudgetId ?? null,
    sourceBudgetOption: null,
    sourceBudgetOptionId: values.sourceBudgetOptionId ?? null,
    updatedAt: now,
    updatedBy: null,
    updatedById: null,
  } as OpsJobListItem;
};

export const useJobMutations = () => {
  const queryClient = useQueryClient();

  const createJobMutation = useMutation({
    mutationFn: (values: CreateJobInput & MutationErrorAction) =>
      createJobAction(stripMutationErrorAction(values)),
    onMutate: async (values) => {
      const snapshots = await snapshotQueries(queryClient, jobRoots);
      const optimisticJob = buildOptimisticJob(values);

      reconcileListItem(queryClient, opsQueryKeys.jobs, optimisticJob, {
        matches: matchesJobFilters,
        sort: sortJobs,
      });

      return { optimisticId: optimisticJob.id, snapshots };
    },
    onSuccess: (job, _values, context) => {
      if (!job) return;
      reconcileListItem(queryClient, opsQueryKeys.jobs, job, {
        matches: matchesJobFilters,
        sort: sortJobs,
        tempId: context?.optimisticId,
      });
      upsertDetail(queryClient, opsQueryKeys.job(job.id), job);
      void invalidateVisitScopes(queryClient);
      toast.success("Trabajo creado");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al crear el trabajo", values.onErrorAction);
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, values }: { jobId: string; values: UpdateJobInput } & MutationErrorAction) =>
      updateJobAction(jobId, values),
    onMutate: async ({ jobId, values }) => {
      const snapshots = await snapshotQueries(queryClient, jobRoots);
      patchListItem<OpsJobListItem>(
        queryClient,
        opsQueryKeys.jobs,
        jobId,
        (job) => ({ ...job, ...values, updatedAt: new Date() }),
        { matches: matchesJobFilters, sort: sortJobs }
      );

      return { snapshots };
    },
    onSuccess: (job) => {
      if (!job) return;
      reconcileListItem(queryClient, opsQueryKeys.jobs, job, {
        matches: matchesJobFilters,
        sort: sortJobs,
      });
      upsertDetail(queryClient, opsQueryKeys.job(job.id), job);
      void invalidateVisitScopes(queryClient);
      toast.success("Trabajo actualizado");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al actualizar el trabajo", values.onErrorAction);
    },
  });

  const archiveJobMutation = useMutation({
    mutationFn: (jobId: string) => archiveJobAction(jobId),
    onMutate: async (jobId) => {
      const snapshots = await snapshotQueries(queryClient, jobRoots);
      patchListItem<OpsJobListItem>(
        queryClient,
        opsQueryKeys.jobs,
        jobId,
        (job) => ({
          ...job,
          archivedAt: new Date(),
          status: "ARCHIVED",
          updatedAt: new Date(),
        }),
        { matches: matchesJobFilters, sort: sortJobs }
      );

      return { snapshots };
    },
    onSuccess: (job) => {
      if (!job) return;
      reconcileListItem(queryClient, opsQueryKeys.jobs, job, {
        matches: matchesJobFilters,
        sort: sortJobs,
      });
      upsertDetail(queryClient, opsQueryKeys.job(job.id), job);
      void invalidateVisitScopes(queryClient);
      toast.success("Trabajo archivado");
    },
    onError: (error, _jobId, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al archivar el trabajo");
    },
  });

  return {
    createJobAsync: createJobMutation.mutateAsync,
    updateJobAsync: updateJobMutation.mutateAsync,
    archiveJobAsync: archiveJobMutation.mutateAsync,
    isCreating: createJobMutation.isPending,
    isUpdating: updateJobMutation.isPending,
    isArchiving: archiveJobMutation.isPending,
  };
};
