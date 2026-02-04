"use server"

import { db } from "@/lib/db"

export default async function deleteBudgetCategory(id: string) {
    try {
        const result = await db.budgetCategory.delete({
            where: {
                id
            }
        })

        return result
    } catch (error) {
        return { error : "Error al eliminar la categoría" }
    }
}