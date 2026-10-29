"use server";

import { z } from "zod";

import { getAgentBudget } from "@/data/agent/budgets";
import { budgetOptionToFormValues } from "@/lib/agent/budget-calculation";
import { getBudgetUrl } from "@/lib/agent/proposals";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";

// Un presupuesto guardado para el Sheet del chat (Abrir en una tarjeta): sus
// opciones con los valores del formulario, sin productos primero, como las
// muestra la página del presupuesto. Solo lectura.
const slugSchema = z.string().trim().min(1).max(200);

export const getAgentSavedBudget = async (slug: unknown) => {
  try {
    await requireAdminSession();
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) return { error: "Presupuesto inválido" };
    const budget = await getAgentBudget({ slug: parsed.data });
    if (!budget) return { error: "Ese presupuesto ya no existe" };
    const options = [...budget.budgetOptions]
      .sort((a, b) => Number(a.has_products) - Number(b.has_products))
      .map((option) => ({
        hasProducts: option.has_products,
        values: budgetOptionToFormValues({ ...budget, budgetOptions: [option] }),
      }));
    return {
      budget: {
        name: budget.name,
        description: budget.description,
        url: getBudgetUrl(budget.slug),
        options,
      },
    };
  } catch (error) {
    console.error("Error reading saved budget for the agent:", error);
    return {
      error: error instanceof AdminAuthorizationError ? error.message : "No se pudo abrir el presupuesto",
    };
  }
};
