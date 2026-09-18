import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// El presupuesto completo que usan los cálculos y las propuestas del agente:
// opciones (con cuántos trabajos apuntan a cada una), categorías y vínculo
// oficial. Sin categorías, guardar un cambio las borraría.
export const getAgentBudget = async (where: { id: string } | { slug: string }) => {
  await requireAdminSession();
  return db.budget.findUnique({
    where,
    include: {
      budgetOptions: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { _count: { select: { sourcedJobs: true } } },
      },
      budgetCategory: { select: { id: true, name: true } },
      officialBudget: { select: { id: true, status: true, currentVersion: true } },
    },
  });
};

export type AgentBudget = NonNullable<Awaited<ReturnType<typeof getAgentBudget>>>;

// Lo que se re-valida al confirmar una propuesta: que el presupuesto siga
// siendo el mismo que mostró la tarjeta.
export const getAgentBudgetState = async (budgetId: string) => {
  await requireAdminSession();
  return db.budget.findUnique({
    where: { id: budgetId },
    select: {
      userId: true,
      updatedAt: true,
      officialBudget: { select: { id: true } },
    },
  });
};
