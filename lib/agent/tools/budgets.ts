import "server-only";

import { tool } from "ai";

import { findAgentBudgetsByService, MATCHING_BUDGETS_LIMIT } from "@/data/agent/budgets";
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
import { getStoredPrices } from "@/lib/agent/proposal-summary";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import {
  findMatchingBudgetsInputSchema,
  getBudgetInputSchema,
  searchBudgetsInputSchema,
} from "@/schemas/agent-tools";

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

  // Antes de armar uno nuevo: si ya hay uno guardado igual, su precio se
  // puede citar (las opciones guardadas son la fuente) y no hace falta otro.
  findMatchingBudgets: tool({
    description:
      "Busca presupuestos generadores guardados con el mismo servicio: frecuencia, visitas, horas por visita, empleadas y, si lleva, la opción con productos. Usala antes de armar uno nuevo, con los mismos datos que searchOfficialBudgets. Devuelve los precios guardados de cada uno, que se pueden citar; el primero es el más reciente.",
    inputSchema: findMatchingBudgetsInputSchema,
    execute: (input) =>
      runTool("findMatchingBudgets", async () => {
        const found = await findAgentBudgetsByService({
          visit_type: input.frequency,
          visits: input.visits,
          hours_per_visit: input.hoursPerVisit,
          employees: input.employees ?? 1,
          withProducts: input.hasProducts === true,
        });
        const budgets = found.slice(0, MATCHING_BUDGETS_LIMIT);
        const grounding = {
          amounts: budgets.flatMap((budget) => getStoredOptionAmounts(budget.budgetOptions)),
        };
        addToolGrounding(ctx.grounding, grounding);
        return toolOk({
          card: "list" as const,
          kind: "matchingBudgets" as const,
          total: budgets.length,
          truncated: found.length > budgets.length,
          rows: budgets.map((budget) => ({
            id: budget.id,
            slug: budget.slug,
            name: budget.name,
            official: budget.officialBudget
              ? { status: budget.officialBudget.status, version: budget.officialBudget.currentVersion }
              : null,
            updatedAt: budget.updatedAt.toISOString(),
            prices: getStoredPrices(budget),
          })),
          grounding,
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
