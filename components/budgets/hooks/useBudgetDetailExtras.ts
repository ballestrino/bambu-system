import { useQuery } from "@tanstack/react-query";

import { readBudgetDetailExtras } from "@/components/budgets/actions/budget-reads";
import { budgetKeys } from "@/components/budgets/query-keys";
import ValidationError from "@/instances/validation-error";

// Trabajos del presupuesto y fecha de su versión oficial (data/budget-detail.ts).
export const useBudgetDetailExtras = (slug: string, budgetId: string | undefined) =>
  useQuery({
    queryKey: budgetKeys.detailExtras(slug),
    enabled: Boolean(budgetId),
    queryFn: async () => {
      const result = await readBudgetDetailExtras(budgetId ?? "");
      if (!result.extras) throw new ValidationError(result.error ?? "No se pudieron leer los trabajos");
      return result.extras;
    },
  });
