import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

export const getBudgetSources = async () => {
  try {
    await requireAdminSession();

    const budgets = await db.budget.findMany({
      include: {
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
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    });

    return { budgets };
  } catch (error) {
    console.error("Error getting budget sources:", error);
    return { error: "Error al obtener los presupuestos base" };
  }
};
