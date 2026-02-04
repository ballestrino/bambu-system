"use server"

import { db } from "@/lib/db"

export default async function createBudgetCategory(name: string, description: string) {
    try {
        const result = await db.budgetCategory.create({
            data: {
                name,
                description
            }
        })

        return result
    } catch (error) {
        return { error : "Error al crear la categoría" }
    }
}