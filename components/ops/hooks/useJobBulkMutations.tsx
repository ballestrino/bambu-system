"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { setJobsStatusAction } from "@/components/ops/actions/jobs/set-jobs-status.action";
import {
  patchListItem,
  reconcileListItem,
  restoreSnapshots,
  snapshotQueries,
  upsertDetail,
} from "@/components/ops/cache/optimistic-cache";
import { matchesJobFilters, sortJobs } from "@/components/ops/cache/optimistic-filters";
import { showMutationError } from "@/components/ops/cache/mutation-toast";
import { invalidateVisitScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OpsJobListItem } from "@/components/ops/types";
import type { SetJobsStatusInput } from "@/schemas/ops";

const jobRoots = [opsQueryKeys.jobs, opsQueryKeys.occurrenceRoot, opsQueryKeys.calendarRoot];

const doneLabels: Record<SetJobsStatusInput["status"], [string, string]> = {
  ACTIVE: ["reactivado", "reactivados"],
  PAUSED: ["pausado", "pausados"],
  ARCHIVED: ["archivado", "archivados"],
};

export const getJobsStatusDoneLabel = (status: SetJobsStatusInput["status"], count: number) =>
  `${count} ${count === 1 ? `trabajo ${doneLabels[status][0]}` : `trabajos ${doneLabels[status][1]}`}`;

// Reactivar, pausar o archivar varios trabajos de la tabla con una acción.
export const useJobBulkMutations = () => {
  const queryClient = useQueryClient();

  const setJobsStatusMutation = useMutation({
    mutationFn: (values: SetJobsStatusInput) => setJobsStatusAction(values),
    onMutate: async ({ jobIds, status }) => {
      const snapshots = await snapshotQueries(queryClient, jobRoots);
      const now = new Date();

      for (const jobId of jobIds) {
        patchListItem<OpsJobListItem>(
          queryClient,
          opsQueryKeys.jobs,
          jobId,
          (job) => ({
            ...job,
            archivedAt: status === "ARCHIVED" ? now : null,
            status,
            updatedAt: now,
          }),
          { matches: matchesJobFilters, sort: sortJobs }
        );
      }

      return { snapshots };
    },
    onSuccess: (jobs, { status }) => {
      for (const job of jobs) {
        reconcileListItem(queryClient, opsQueryKeys.jobs, job, {
          matches: matchesJobFilters,
          sort: sortJobs,
        });
        upsertDetail(queryClient, opsQueryKeys.job(job.id), job);
      }
      void invalidateVisitScopes(queryClient);
      toast.success(getJobsStatusDoneLabel(status, jobs.length));
    },
    onError: (error, _values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al cambiar los trabajos");
    },
  });

  return {
    isSettingStatus: setJobsStatusMutation.isPending,
    setJobsStatusAsync: setJobsStatusMutation.mutateAsync,
  };
};
