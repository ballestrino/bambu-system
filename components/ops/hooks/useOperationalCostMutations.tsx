"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createOperationalCostAction } from "@/components/ops/actions/create-operational-cost.action";
import { updateOperationalCostAction } from "@/components/ops/actions/update-operational-cost.action";
import { voidOperationalCostAction } from "@/components/ops/actions/void-operational-cost.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type {
  CreateOperationalCostInput,
  UpdateOperationalCostInput,
} from "@/schemas/ops";

export const useOperationalCostMutations = () => {
  const queryClient = useQueryClient();
  const invalidateCosts = async () => {
    await queryClient.invalidateQueries({ queryKey: opsQueryKeys.costs });
  };

  const createCostMutation = useMutation({
    mutationFn: (values: CreateOperationalCostInput) =>
      createOperationalCostAction(values),
    onSuccess: async () => {
      toast.success("Coste creado");
      await invalidateCosts();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear el coste");
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: ({
      costId,
      values,
    }: {
      costId: string;
      values: UpdateOperationalCostInput;
    }) => updateOperationalCostAction(costId, values),
    onSuccess: async () => {
      toast.success("Coste actualizado");
      await invalidateCosts();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el coste");
    },
  });

  const voidCostMutation = useMutation({
    mutationFn: (costId: string) => voidOperationalCostAction(costId),
    onSuccess: async () => {
      toast.success("Coste anulado");
      await invalidateCosts();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al anular el coste");
    },
  });

  return {
    createCostAsync: createCostMutation.mutateAsync,
    updateCostAsync: updateCostMutation.mutateAsync,
    voidCostAsync: voidCostMutation.mutateAsync,
    isCreating: createCostMutation.isPending,
    isUpdating: updateCostMutation.isPending,
    isVoiding: voidCostMutation.isPending,
  };
};
