import "server-only";

import { tool } from "ai";

import { getBudgetById, getBudgetBySlug } from "@/data/budget";
import { getBudgets } from "@/data/budgets";
import {
  budgetOptionToFormValues,
  describeBudgetInputs,
  getCalculationAmounts,
  getStoredOptionAmounts,
  runBudgetCalculation,
} from "@/lib/agent/budget-calculation";
import { addToolGrounding } from "@/lib/agent/grounding";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { getBudgetInputSchema, searchBudgetsInputSchema } from "@/schemas/agent-tools";

const truncate = (text: string | null, max: number) =>
  text && text.length > max ? `${text.slice(0, max - 1)}…` : text;

const loadBudget = async (
  ctx: AgentToolContext,
  input: { slug: string | null; budgetId: string | null }
) => {
  if (input.slug) {
    const result = await getBudgetBySlug(input.slug);
    return "error" in result ? null : result.budget;
  }
  const id = input.budgetId ?? ctx.budgetId;
  return id ? getBudgetById(id) : null;
};

// Presupuestos generadores (los del formulario), no los oficiales.
export const createBudgetTools = (ctx: AgentToolContext) => ({
  searchBudgets: tool({
    description:
      "Busca presupuestos generadores por nombre o descripción y devuelve filas compactas con slug. No trae precios: para eso abrí uno con getBudget.",
    inputSchema: searchBudgetsInputSchema,
    execute: (input) =>
      runTool("searchBudgets", async () => {
        const result = await getBudgets(input.query ?? undefined, input.page ?? 1, input.limit ?? 10);
        if ("error" in result) return toolError("read_failed", result.error);
        return toolOk({
          card: "list" as const,
          kind: "budgets" as const,
          total: result.totalCount,
          page: result.currentPage,
          totalPages: result.totalPages,
          truncated: result.totalPages > result.currentPage,
          rows: result.budgets.map((budget) => ({
            id: budget.id,
            slug: budget.slug,
            name: budget.name,
            description: truncate(budget.description, 160),
            categories: budget.budgetCategory.map((category) => category.name),
            official: budget.officialBudget
              ? { status: budget.officialBudget.status, version: budget.officialBudget.currentVersion }
              : null,
            updatedAt: budget.updatedAt.toISOString(),
          })),
        });
      }),
  }),

  getBudget: tool({
    description:
      "Abre un presupuesto generador por slug o id con sus insumos (aportes incluidos), totales sin y con productos y precio por hora. Sus importes se pueden citar. Para el presupuesto en contexto mandá slug y budgetId en null: no inventes ninguno.",
    inputSchema: getBudgetInputSchema,
    execute: (input) =>
      runTool("getBudget", async () => {
        const budget = await loadBudget(ctx, input);
        if (!budget && !input.slug && !input.budgetId && ctx.formValues) {
          return toolError(
            "unsaved_budget",
            "El presupuesto en contexto todavía no está guardado: sus valores están en tus instrucciones. Para calcular usá calculateBudget."
          );
        }
        if (!budget) {
          return toolError(
            "not_found",
            "No encontré ese presupuesto. Buscalo con searchBudgets o, para el que está en contexto, llamá getBudget con slug y budgetId en null."
          );
        }

        const values = budgetOptionToFormValues(budget);
        const calculation = runBudgetCalculation(values);
        const grounding = {
          amounts: [
            ...getStoredOptionAmounts(budget.budgetOptions),
            ...getCalculationAmounts(calculation),
          ],
        };
        addToolGrounding(ctx.grounding, grounding);

        return toolOk({
          card: "budget" as const,
          id: budget.id,
          slug: budget.slug,
          name: budget.name,
          description: truncate(budget.description, 600),
          inputs: describeBudgetInputs(values),
          storedOptions: budget.budgetOptions.map((option) => ({
            hasProducts: option.has_products,
            finalPrice: option.price,
          })),
          calculation,
          grounding,
        });
      }),
  }),
});
