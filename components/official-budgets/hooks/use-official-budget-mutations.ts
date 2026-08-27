"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  archiveOfficialBudget,
  publishOfficialBudget,
} from "@/actions/official-budgets/official-budget-actions";
import { officialBudgetKeys } from "@/components/official-budgets/query-keys";

export const useOfficialBudgetMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: officialBudgetKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["budgets"] }),
      queryClient.invalidateQueries({ queryKey: ["budget"] }),
    ]);
  };

  const publish = useMutation({
    mutationFn: async (sourceBudgetId: string) => {
      const result = await publishOfficialBudget({ sourceBudgetId });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: async (result) => {
      toast.success(result.success ?? "Presupuesto oficial publicado");
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const archive = useMutation({
    mutationFn: async (officialBudgetId: string) => {
      const result = await archiveOfficialBudget({ officialBudgetId });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: async (result) => {
      toast.success(result.success ?? "Presupuesto oficial archivado");
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return { publish, archive };
};
