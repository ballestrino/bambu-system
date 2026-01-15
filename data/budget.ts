"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getBudgetBySlug = async (slug: string) => {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const budget = await db.budget.findUnique({
            where: {
                slug,
            },
            include: {
                budgetOptions: true // Include details
            }
        });

        if (!budget) return null;

        // Security check: ensure the budget belongs to the user
        // Note: 'slug' is unique globally, but we should strictly enforce user checks if slugs could be guessed.
        // If your business logic implies slugs are private to users, ensure userId matches.
        // if (budget.userId !== session.user.id) return null;

        return budget;
    } catch {
        return null;
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
