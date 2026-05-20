"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveEmployeeAction } from "@/components/ops/actions/archive-employee.action";
import { createEmployeeAction } from "@/components/ops/actions/create-employee.action";
import { updateEmployeeAction } from "@/components/ops/actions/update-employee.action";
import { invalidateEmployeeScopes } from "@/components/ops/hooks/useOpsInvalidation";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/schemas/ops";

export const useEmployeeMutations = () => {
  const queryClient = useQueryClient();

  const invalidateEmployeeQueries = async (employeeId?: string) => {
    await invalidateEmployeeScopes(queryClient, { employeeId });
  };

  const createEmployeeMutation = useMutation({
    mutationFn: (values: CreateEmployeeInput) => createEmployeeAction(values),
    onSuccess: async (employee) => {
      if (!employee) return;
      toast.success("Empleada creada");
      await invalidateEmployeeQueries(employee.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear la empleada");
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: string; values: UpdateEmployeeInput }) =>
      updateEmployeeAction(employeeId, values),
    onSuccess: async (employee) => {
      if (!employee) return;
      toast.success("Empleada actualizada");
      await invalidateEmployeeQueries(employee.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la empleada");
    },
  });

  const archiveEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) => archiveEmployeeAction(employeeId),
    onSuccess: async (employee) => {
      if (!employee) return;
      toast.success("Empleada archivada");
      await invalidateEmployeeQueries(employee.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al archivar la empleada");
    },
  });

  return {
    createEmployeeAsync: createEmployeeMutation.mutateAsync,
    updateEmployeeAsync: updateEmployeeMutation.mutateAsync,
    archiveEmployeeAsync: archiveEmployeeMutation.mutateAsync,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isArchiving: archiveEmployeeMutation.isPending,
  };
};
