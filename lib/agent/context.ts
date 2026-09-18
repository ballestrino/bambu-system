import "server-only";

import { getBudgetById } from "@/data/budget";
import {
  budgetOptionToFormValues,
  getCalculationAmounts,
  getStoredOptionAmounts,
  runBudgetCalculation,
} from "@/lib/agent/budget-calculation";
import { formatBudgetForAI } from "@/lib/format-budget";
import type { AgentBudgetContextInput } from "@/schemas/agent";
import { defaultBudgetValues, type BudgetFormValues } from "@/schemas/BudgetSchema";

// El presupuesto que el usuario está mirando. Guardado: lectura fresca en cada
// turno. Formulario: los valores sin guardar que manda el cliente. Los
// importes del contexto se pueden citar, igual que los de una tool.
export type ResolvedBudgetContext = {
  kind: "saved" | "form" | null;
  budgetId: string | null;
  formValues: BudgetFormValues | null;
  text: string | null;
  amounts: number[];
};

const NO_CONTEXT: ResolvedBudgetContext = {
  kind: null,
  budgetId: null,
  formValues: null,
  text: null,
  amounts: [],
};

export const resolveBudgetContext = async (
  input?: AgentBudgetContextInput
): Promise<ResolvedBudgetContext> => {
  if (!input) return NO_CONTEXT;

  if (input.kind === "saved") {
    const budget = await getBudgetById(input.budgetId);
    if (!budget) {
      return { ...NO_CONTEXT, text: "El presupuesto de esta conversación ya no existe." };
    }
    const values = budgetOptionToFormValues(budget);
    // El slug va a la vista: sin él, el modelo inventaba uno para getBudget.
    const header = `Presupuesto guardado "${budget.name}" (slug ${budget.slug}). Para leerlo o calcular sobre él dejá el slug en null.`;
    return {
      kind: "saved",
      budgetId: budget.id,
      formValues: null,
      text: `${header}\n\n${formatBudgetForAI({
        name: budget.name,
        description: budget.description ?? undefined,
        budgetOptions: budget.budgetOptions,
      })}`,
      amounts: [
        ...getStoredOptionAmounts(budget.budgetOptions),
        ...getCalculationAmounts(runBudgetCalculation(values)),
      ],
    };
  }

  const values: BudgetFormValues = { ...defaultBudgetValues, ...input.values };
  return {
    kind: "form",
    budgetId: null,
    formValues: values,
    text: formatBudgetForAI({ ...values, name: values.name || "Presupuesto sin guardar" }),
    amounts: [
      ...getStoredOptionAmounts([{ price: values.price, iva: values.iva }]),
      ...getCalculationAmounts(runBudgetCalculation(values)),
    ],
  };
};
