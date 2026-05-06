"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobAction } from "@/components/ops/actions/archive-job.action";
import { createJobAction } from "@/components/ops/actions/create-job.action";
import { updateJobAction } from "@/components/ops/actions/update-job.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { CreateJobInput, UpdateJobInput } from "@/schemas/ops";

export const useJobMutations = () => {
  const queryClient = useQueryClient();

  const invalidateJobQueries = async (jobId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.jobs }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.occurrences() }),
      queryClient.invalidateQueries({ queryKey: ["ops", "calendar"] }),
      jobId
        ? queryClient.invalidateQueries({ queryKey: opsQueryKeys.job(jobId) })
        : Promise.resolve(),
    ]);
  };

  const createJobMutation = useMutation({
    mutationFn: (values: CreateJobInput) => createJobAction(values),
    onSuccess: async (job) => {
      if (!job) {
        return;
      }

      toast.success("Trabajo creado");
      await invalidateJobQueries(job.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear el trabajo");
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, values }: { jobId: string; values: UpdateJobInput }) =>
      updateJobAction(jobId, values),
    onSuccess: async (job) => {
      if (!job) {
        return;
      }

      toast.success("Trabajo actualizado");
      await invalidateJobQueries(job.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el trabajo");
    },
  });

  const archiveJobMutation = useMutation({
    mutationFn: (jobId: string) => archiveJobAction(jobId),
    onSuccess: async (job) => {
      if (!job) {
        return;
      }

      toast.success("Trabajo archivado");
      await invalidateJobQueries(job.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al archivar el trabajo");
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
