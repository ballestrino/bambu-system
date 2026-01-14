"use server"

import { db } from "@/lib/db"

export default async function deleteBudget(budgetId: string) {
    try {
        await db.budget.delete({
            where: { id: budgetId },
        });

        return { success: "Presupuesto eliminado exitosamente" }
    } catch (error) {
        return { error: "Error elminando el presupuesto" };
    }
}