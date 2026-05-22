"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveOperationalCostCategoryAction } from "@/components/ops/actions/costs/archive-operational-cost-category.action";
import { createOperationalCostCategoryAction } from "@/components/ops/actions/costs/create-operational-cost-category.action";
import { updateOperationalCostCategoryAction } from "@/components/ops/actions/costs/update-operational-cost-category.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type {
  CreateOperationalCostCategoryInput,
  UpdateOperationalCostCategoryInput,
} from "@/schemas/ops";

export const useOperationalCostCategoryMutations = () => {
  const queryClient = useQueryClient();
  const invalidateCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: opsQueryKeys.costCategories });
  };

  const createCategoryMutation = useMutation({
    mutationFn: (values: CreateOperationalCostCategoryInput) =>
      createOperationalCostCategoryAction(values),
    onSuccess: async () => {
      toast.success("Categoria creada");
      await invalidateCategories();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear la categoria");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      categoryId,
      values,
    }: {
      categoryId: string;
      values: UpdateOperationalCostCategoryInput;
    }) => updateOperationalCostCategoryAction(categoryId, values),
    onSuccess: async () => {
      toast.success("Categoria actualizada");
      await invalidateCategories();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la categoria");
    },
  });

  const archiveCategoryMutation = useMutation({
    mutationFn: (categoryId: string) =>
      archiveOperationalCostCategoryAction(categoryId),
    onSuccess: async () => {
      toast.success("Categoria archivada");
      await invalidateCategories();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al archivar la categoria");
    },
  });

  return {
    archiveCategoryAsync: archiveCategoryMutation.mutateAsync,
    createCategoryAsync: createCategoryMutation.mutateAsync,
    updateCategoryAsync: updateCategoryMutation.mutateAsync,
    isArchiving: archiveCategoryMutation.isPending,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
  };
};

