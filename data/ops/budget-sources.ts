import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import type { Prisma } from "@prisma/client";

const DEFAULT_LIMIT = 5;

export type GetBudgetSourcesParams = {
  limit?: number;
  page?: number;
  query?: string;
  selectedBudgetId?: string;
};

const budgetSourceInclude = {
  budgetOptions: {
    orderBy: [{ createdAt: "asc" }],
  },
  budgetCategory: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
} satisfies Prisma.BudgetInclude;

const getBudgetSearchWhere = (query?: string): Prisma.BudgetWhereInput => {
  const terms = query?.split(" ").filter(Boolean) ?? [];

  if (terms.length === 0) return {};

  return {
    AND: terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    })),
  };
};

export const getBudgetSources = async ({
  limit = DEFAULT_LIMIT,
  page = 1,
  query,
  selectedBudgetId,
}: GetBudgetSourcesParams = {}) => {
  try {
    await requireAdminSession();
    const currentPage = Math.max(1, page);
    const pageSize = Math.max(1, Math.min(limit, DEFAULT_LIMIT));
    const where = getBudgetSearchWhere(query);

    const [budgets, totalCount] = await Promise.all([
      db.budget.findMany({
        where,
        include: budgetSourceInclude,
        orderBy: [{ updatedAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      db.budget.count({ where }),
    ]);

    const selectedBudget =
      selectedBudgetId && !budgets.some((budget) => budget.id === selectedBudgetId)
        ? await db.budget.findUnique({
            where: { id: selectedBudgetId },
            include: budgetSourceInclude,
          })
        : null;

    const mergedBudgets = selectedBudget ? [selectedBudget, ...budgets] : budgets;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      budgets: mergedBudgets,
      currentPage,
      hasNextPage: currentPage < totalPages,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("Error getting budget sources:", error);
    return { error: "Error al obtener los presupuestos base" };
  }
};
