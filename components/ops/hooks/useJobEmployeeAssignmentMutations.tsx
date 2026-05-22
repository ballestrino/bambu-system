"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobEmployeeAssignmentAction } from "@/components/ops/actions/jobs/archive-job-employee-assignment.action";
import { createJobEmployeeAssignmentAction } from "@/components/ops/actions/jobs/create-job-employee-assignment.action";
import { updateJobEmployeeAssignmentAction } from "@/components/ops/actions/jobs/update-job-employee-assignment.action";
import { invalidateOperationalScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { CreateJobEmployeeAssignmentInput, UpdateJobEmployeeAssignmentInput } from "@/schemas/ops";

export const useJobEmployeeAssignmentMutations = (jobId?: string, employeeId?: string) => {
  const queryClient = useQueryClient();

  const invalidateAssignmentQueries = async () => {
    await Promise.all([
      invalidateOperationalScopes(queryClient, { employeeId, jobId }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.assignments }),
      jobId
        ? queryClient.invalidateQueries({
            queryKey: opsQueryKeys.assignmentScope(jobId),
          })
        : Promise.resolve(),
      employeeId
        ? queryClient.invalidateQueries({
            queryKey: opsQueryKeys.assignmentScope(employeeId),
          })
        : Promise.resolve(),
    ]);
  };

  const createAssignmentMutation = useMutation({
    mutationFn: (values: CreateJobEmployeeAssignmentInput) =>
      createJobEmployeeAssignmentAction(values),
    onSuccess: async () => {
      toast.success("Empleada asignada");
      await invalidateAssignmentQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al asignar la empleada");
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, values }: { assignmentId: string; values: UpdateJobEmployeeAssignmentInput }) =>
      updateJobEmployeeAssignmentAction(assignmentId, values),
    onSuccess: async () => {
      toast.success("Asignacion actualizada");
      await invalidateAssignmentQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la asignacion");
    },
  });

  const archiveAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => archiveJobEmployeeAssignmentAction(assignmentId),
    onSuccess: async () => {
      toast.success("Empleada desasignada");
      await invalidateAssignmentQueries();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al desasignar la empleada");
    },
  });

  return {
    createAssignmentAsync: createAssignmentMutation.mutateAsync,
    updateAssignmentAsync: updateAssignmentMutation.mutateAsync,
    archiveAssignmentAsync: archiveAssignmentMutation.mutateAsync,
    isCreating: createAssignmentMutation.isPending,
    isUpdating: updateAssignmentMutation.isPending,
    isArchiving: archiveAssignmentMutation.isPending,
  };
};

