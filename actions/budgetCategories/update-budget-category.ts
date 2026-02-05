"use server"

import { db } from "@/lib/db"

export default async function updateNameBudgetCategory(id: string, name: string, description: string, color: string, isActive: boolean) {
    try {
        const result = await db.budgetCategory.update({
            where: {
                id
            },
            data: {
                name,
                description,
                color,
                isActive
            }
        })

        return result
    } catch (error) {
        return { error : "Error al actualizar la categoría" }
    }
}