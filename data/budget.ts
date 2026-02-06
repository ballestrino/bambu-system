"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getBudgetBySlug = async (slug: string) => {
    try {
        const session = await auth();
        if (!session?.user?.id || session?.user.role !== "ADMIN") {
            return { error : "Necesitas iniciar sesión y ser administrador"}
        }

        const budget = await db.budget.findUnique({
            where: {
                slug,
            },
            include: {
                budgetOptions: true, // Include details
                budgetCategory: true
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
        const session = await auth();
        if (!session?.user?.id) return null;

        const budget = await db.budget.findUnique({
            where: { id },
             include: {
                budgetOptions: true
            }
        });

        // if (budget && budget.userId !== session.user.id) return null;

        return budget;
    } catch {
        return null;
    }
};
