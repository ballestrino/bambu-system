import type { Prisma } from "@prisma/client";

export type GeneratorBudgetListItem = Prisma.BudgetGetPayload<{
  include: {
    budgetCategory: true;
    officialBudget: {
      select: { id: true; status: true; currentVersion: true };
    };
  };
}>;
