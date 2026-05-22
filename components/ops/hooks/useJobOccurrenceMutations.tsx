"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobOccurrenceAction } from "@/components/ops/actions/jobs/archive-job-occurrence.action";
import { createJobOccurrenceAction } from "@/components/ops/actions/jobs/create-job-occurrence.action";
import { detachJobOccurrenceAction } from "@/components/ops/actions/jobs/detach-job-occurrence.action";
import { updateJobOccurrenceAction } from "@/components/ops/actions/jobs/update-job-occurrence.action";
import { invalidateOperationalScopes } from "@/components/ops/hooks/useOpsInvalidation";
import type {
  CreateJobOccurrenceInput,
  DetachJobOccurrenceInput,
  UpdateJobOccurrenceInput,
} from "@/schemas/ops";

export const useJobOccurrenceMutations = (jobId?: string) => {
  const queryClient = useQueryClient();

  const invalidateQueries = async () => {
    await invalidateOperationalScopes(queryClient, { jobId });
  };

  const createMutation = useMutation({
    mutationFn: (values: CreateJobOccurrenceInput) =>
      createJobOccurrenceAction(values),
    onSuccess: async (occurrence) => {
      if (!occurrence) {
        return;
      }

      toast.success("Ocurrencia creada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear la ocurrencia");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      occurrenceId,
      values,
    }: {
      occurrenceId: string;
      values: UpdateJobOccurrenceInput;
    }) => updateJobOccurrenceAction(occurrenceId, values),
    onSuccess: async (occurrence) => {
      if (!occurrence) {
        return;
      }

      toast.success("Ocurrencia actualizada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la ocurrencia");
    },
  });

  const detachMutation = useMutation({
    mutationFn: ({
      occurrenceId,
      values,
    }: {
      occurrenceId: string;
      values?: DetachJobOccurrenceInput;
    }) => detachJobOccurrenceAction(occurrenceId, values),
    onSuccess: async (occurrence) => {
      if (!occurrence) {
        return;
      }

      toast.success("Ocurrencia separada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al separar la ocurrencia");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (occurrenceId: string) => archiveJobOccurrenceAction(occurrenceId),
    onSuccess: async (occurrence) => {
      if (!occurrence) {
        return;
      }

      toast.success("Ocurrencia archivada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al archivar la ocurrencia");
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

