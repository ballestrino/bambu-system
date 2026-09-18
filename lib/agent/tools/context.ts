import "server-only";

import { getBudgetById, getBudgetBySlug } from "@/data/budget";
import { budgetOptionToFormValues } from "@/lib/agent/budget-calculation";
import type { Grounding } from "@/lib/agent/grounding";
import type { AgentUsageCollector } from "@/lib/agent/usage-collector";
import type { AgentMode } from "@/lib/ai/modes";
import { defaultBudgetValues, type BudgetFormValues } from "@/schemas/BudgetSchema";

// Lo que comparten las tools de un turno. grounding y usage se completan
// mientras corre el turno; el resto es fijo.
export type AgentToolContext = {
  actorId: string;
  conversationId: string;
  mode: AgentMode;
  budgetId: string | null;
  formValues: BudgetFormValues | null;
  grounding: Grounding;
  usage: AgentUsageCollector;
};

export type BudgetBase = {
  source: "context" | "form" | "budget" | "defaults";
  name: string;
  slug: string | null;
  values: BudgetFormValues;
};

type BaseInput = { budgetSlug: string | null; fromDefaults: boolean | null };

const fromDefaults = (): BudgetBase => ({
  source: "defaults",
  name: "Presupuesto nuevo",
  slug: null,
  values: { ...defaultBudgetValues, name: "Presupuesto nuevo" },
});

// De qué valores parte un cálculo: lo pedido explícitamente, si no el
// formulario abierto, si no el presupuesto en contexto, si no los defaults.
export const resolveBudgetBase = async (
  ctx: AgentToolContext,
  input: BaseInput
): Promise<BudgetBase | { error: string }> => {
  if (input.fromDefaults) return fromDefaults();

  if (input.budgetSlug) {
    const result = await getBudgetBySlug(input.budgetSlug);
    if ("error" in result || !result.budget) {
      return { error: `No encontré el presupuesto "${input.budgetSlug}".` };
    }
    return {
      source: "budget",
      name: result.budget.name,
      slug: result.budget.slug,
      values: budgetOptionToFormValues(result.budget),
    };
  }

  if (ctx.formValues) {
    return {
      source: "form",
      name: ctx.formValues.name || "Presupuesto sin guardar",
      slug: null,
      values: ctx.formValues,
    };
  }

  if (ctx.budgetId) {
    const budget = await getBudgetById(ctx.budgetId);
    if (!budget) return { error: "El presupuesto en contexto ya no existe." };
    return {
      source: "context",
      name: budget.name,
      slug: budget.slug,
      values: budgetOptionToFormValues(budget),
    };
  }

  return fromDefaults();
};
