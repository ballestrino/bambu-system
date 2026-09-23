"use server";

import { getBudgetCategories, getBudgetCategoryById } from "@/data/budgetCategory";

// Server Actions for the client hooks. The data reads check the admin session
// themselves and stay server-only.
export const readBudgetCategories = async () => getBudgetCategories();

export const readBudgetCategoryById = async (id: string) => getBudgetCategoryById(id);
