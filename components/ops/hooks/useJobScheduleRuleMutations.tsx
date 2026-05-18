"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobScheduleRuleAction } from "@/components/ops/actions/archive-job-schedule-rule.action";
import { createJobScheduleRuleAction } from "@/components/ops/actions/create-job-schedule-rule.action";
import { updateJobScheduleRuleAction } from "@/components/ops/actions/update-job-schedule-rule.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type {
  CreateJobScheduleRuleInput,
  UpdateJobScheduleRuleInput,
} from "@/schemas/ops";

export const useJobScheduleRuleMutations = (jobId: string) => {
  const queryClient = useQueryClient();

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.job(jobId) }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.scheduleRules(jobId) }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.occurrences(jobId) }),
      queryClient.invalidateQueries({ queryKey: ["ops", "calendar"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (values: CreateJobScheduleRuleInput) =>
      createJobScheduleRuleAction(values),
    onSuccess: async (scheduleRule) => {
      if (!scheduleRule) {
        return;
      }

      toast.success("Regla creada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear la regla");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      scheduleRuleId,
      values,
    }: {
      scheduleRuleId: string;
      values: UpdateJobScheduleRuleInput;
    }) => updateJobScheduleRuleAction(scheduleRuleId, values),
    onSuccess: async (scheduleRule) => {
      if (!scheduleRule) {
        return;
      }

      toast.success("Regla actualizada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la regla");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (scheduleRuleId: string) =>
      archiveJobScheduleRuleAction(scheduleRuleId),
    onSuccess: async (scheduleRule) => {
      if (!scheduleRule) {
        return;
      }

      toast.success("Regla archivada");
      await invalidateQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al archivar la regla");
    },
  });

  return {
    createScheduleRuleAsync: createMutation.mutateAsync,
    updateScheduleRuleAsync: updateMutation.mutateAsync,
    archiveScheduleRuleAsync: archiveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
  };
};
