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

export const MATCHING_BUDGETS_LIMIT = 10;

// Presupuestos guardados con el mismo servicio: frecuencia, visitas, horas
// por visita y empleadas, y la opción con productos si se pide. Todas las
// opciones de un presupuesto comparten esos datos. Los más recientes primero;
// trae uno de más para saber si hay más.
export const findAgentBudgetsByService = async (service: {
  visit_type: "days" | "week" | "month";
  visits: number;
  hours_per_visit: number;
  employees: number;
  withProducts: boolean;
}) => {
  await requireAdminSession();
  return db.budget.findMany({
    where: {
      budgetOptions: {
        some: {
          visit_type: service.visit_type,
          visits: service.visits,
          hours_per_visit: service.hours_per_visit,
          employees: service.employees,
          ...(service.withProducts ? { has_products: true } : {}),
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: MATCHING_BUDGETS_LIMIT + 1,
    select: {
      id: true,
      slug: true,
      name: true,
      updatedAt: true,
      budgetOptions: { select: { has_products: true, price: true, iva: true } },
      officialBudget: { select: { status: true, currentVersion: true } },
    },
  });
};

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
