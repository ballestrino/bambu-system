import type { Prisma } from "@prisma/client";

// Lo que muestra cada fila de la lista: categorías, estado oficial y lo
// necesario de cada opción para el precio, el precio hora y la ganancia.
export const generatorBudgetListInclude = {
  budgetCategory: true,
  officialBudget: {
    select: { id: true, status: true, currentVersion: true },
  },
  budgetOptions: {
    select: {
      id: true,
      has_products: true,
      price: true,
      iva: true,
      visits: true,
      visit_type: true,
      hours_per_visit: true,
      employees: true,
      revenue_percent: true,
    },
    orderBy: { has_products: "asc" },
  },
} satisfies Prisma.BudgetInclude;

export type GeneratorBudgetListItem = Prisma.BudgetGetPayload<{
  include: typeof generatorBudgetListInclude;
}>;

export type BudgetStatusCounts = {
  all: number;
  draft: number;
  official: number;
};
