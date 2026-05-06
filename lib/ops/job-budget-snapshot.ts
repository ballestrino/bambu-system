import "server-only";

import { db } from "@/lib/db";
import type { Budget, BudgetOption, Prisma } from "@prisma/client";

type JobBudgetSourceInput = {
  sourceBudgetId?: string | null;
  sourceBudgetOptionId?: string | null;
};

type ResolvedJobBudgetSource = {
  budget: Budget | null;
  budgetOption: BudgetOption | null;
  budgetSnapshot: Prisma.JsonObject | null;
};

export const buildJobBudgetSnapshot = (
  budget: Budget,
  budgetOption?: BudgetOption | null
): Prisma.JsonObject => {
  const snapshot: Prisma.JsonObject = {
    capturedAt: new Date().toISOString(),
    budget: {
      id: budget.id,
      slug: budget.slug,
      name: budget.name,
      description: budget.description ?? null,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    },
  };

  if (!budgetOption) {
    return snapshot;
  }

  snapshot.option = {
    id: budgetOption.id,
    visits: budgetOption.visits,
    visitType: budgetOption.visit_type,
    hoursPerVisit: budgetOption.hours_per_visit,
    nominalHour: budgetOption.nominal_hour,
    nominalSalary: budgetOption.nominal_salary,
    employees: budgetOption.employees,
    incidenceContribution: budgetOption.incidence_contribution,
    companyContribution: budgetOption.company_contribution,
    personalContribution: budgetOption.personal_contribution,
    transportationCost: budgetOption.transportation_cost,
    productsPrice: budgetOption.products_price,
    productsIva: budgetOption.products_iva,
    productsRevenuePercent: budgetOption.products_revenue_percent,
    revenuePercent: budgetOption.revenue_percent,
    price: budgetOption.price,
    profit: budgetOption.profit ?? null,
    iva: budgetOption.iva,
    hasProducts: budgetOption.has_products,
    createdAt: budgetOption.createdAt.toISOString(),
    updatedAt: budgetOption.updatedAt.toISOString(),
  };

  return snapshot;
};

export const resolveJobBudgetSource = async ({
  sourceBudgetId,
  sourceBudgetOptionId,
}: JobBudgetSourceInput): Promise<ResolvedJobBudgetSource> => {
  if (!sourceBudgetId && !sourceBudgetOptionId) {
    return {
      budget: null,
      budgetOption: null,
      budgetSnapshot: null,
    };
  }

  if (!sourceBudgetId) {
    throw new Error("No puedes asociar una opción sin un presupuesto base");
  }

  const budget = await db.budget.findUnique({
    where: {
      id: sourceBudgetId,
    },
    include: {
      budgetOptions: sourceBudgetOptionId
        ? {
            where: {
              id: sourceBudgetOptionId,
            },
          }
        : false,
    },
  });

  if (!budget) {
    throw new Error("El presupuesto de origen no existe");
  }

  const budgetOption = sourceBudgetOptionId
    ? (budget.budgetOptions[0] ?? null)
    : null;

  if (sourceBudgetOptionId && !budgetOption) {
    throw new Error(
      "La opción de presupuesto no existe o no pertenece al presupuesto seleccionado"
    );
  }

  return {
    budget,
    budgetOption,
    budgetSnapshot: buildJobBudgetSnapshot(budget, budgetOption),
  };
};
