"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createEmployeeAvailabilityRuleAction } from "@/components/ops/actions/employees/create-employee-availability-rule.action";
import { deleteEmployeeAvailabilityRuleAction } from "@/components/ops/actions/employees/delete-employee-availability-rule.action";
import { showMutationError } from "@/components/ops/cache/mutation-toast";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { CreateEmployeeAvailabilityRuleInput } from "@/schemas/ops";

export const useEmployeeAvailabilityMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: opsQueryKeys.employeeAvailability });

  const createMutation = useMutation({
    mutationFn: (values: CreateEmployeeAvailabilityRuleInput) =>
      createEmployeeAvailabilityRuleAction(values),
    onSuccess: () => {
      void invalidate();
      toast.success("Disponibilidad guardada");
    },
    onError: (error) =>
      showMutationError(error, "Error al guardar la disponibilidad"),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteEmployeeAvailabilityRuleAction(ruleId),
    onSuccess: () => {
      void invalidate();
      toast.success("Disponibilidad eliminada");
    },
    onError: (error) =>
      showMutationError(error, "Error al eliminar la disponibilidad"),
  });

  return {
    createRuleAsync: createMutation.mutateAsync,
    deleteRuleAsync: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
