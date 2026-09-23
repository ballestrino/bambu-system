import "server-only";

import { getAgentBudget } from "@/data/agent/budgets";
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

// El presupuesto guardado sobre el que actúa una tool: el pedido por slug o,
// si no, el que está en contexto. null si no hay ninguno guardado.
export const loadTargetBudget = (ctx: AgentToolContext, budgetSlug: string | null) => {
  if (budgetSlug) return getAgentBudget({ slug: budgetSlug });
  return ctx.budgetId ? getAgentBudget({ id: ctx.budgetId }) : Promise.resolve(null);
};

// De qué valores parte un cálculo: lo pedido explícitamente, si no el
// formulario abierto, si no el presupuesto en contexto, si no los defaults.
// Un presupuesto guardado trae sus categorías: una copia las conserva.
export const resolveBudgetBase = async (
  ctx: AgentToolContext,
  input: BaseInput
): Promise<BudgetBase | { error: string }> => {
  if (input.fromDefaults) return fromDefaults();

  if (input.budgetSlug) {
    const budget = await getAgentBudget({ slug: input.budgetSlug });
    if (!budget) return { error: `No encontré el presupuesto "${input.budgetSlug}".` };
    return {
      source: "budget",
      name: budget.name,
      slug: budget.slug,
      values: budgetOptionToFormValues(budget),
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
    const budget = await getAgentBudget({ id: ctx.budgetId });
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
