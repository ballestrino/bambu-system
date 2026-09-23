import "server-only";

import { getBudgetAdminSession } from "@/lib/budget-admin";
import { db } from "@/lib/db";

export const getBudgetBySlug = async (slug: string) => {
    try {
        const admin = await getBudgetAdminSession();
        if ("error" in admin) return { error: admin.error };

        const budget = await db.budget.findUnique({
            where: {
                slug,
            },
            include: {
                budgetOptions: true, // Include details
                budgetCategory: true,
                officialBudget: {
                    select: { id: true, status: true, currentVersion: true }
                }
            }
        });

        if (!budget) return {error : "Presupuesto no encontrado"};

        return { budget : budget};
    } catch {
        return {error : "Error interno, presupuesto no encontrado"};
    }
};

export const getBudgetById = async (id: string) => {
    try {
        const admin = await getBudgetAdminSession();
        if ("error" in admin) return null;

        return await db.budget.findUnique({
            where: { id },
             include: {
                budgetOptions: true
            }
        });
    } catch {
        return null;
    }
};
