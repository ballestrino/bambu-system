"use server"

import { db } from "@/lib/db"

export const getBudgetCategories = async () => { 
    try {
        const result = await db.budgetCategory.findMany()

        return result
    } catch (error) {
        return { error : "Error al obtener las categorías" }
    }
}

export const getBudgetCategoryById = async (id: string) => {
    try {
        const result = await db.budgetCategory.findUnique({
            where: {
                id
            }
        })

        return {category : result}
    } catch (error) {
        return { error : "Error al obtener la categoría" }
    }
}