"use server"

import { db } from "@/lib/db"

export const deleteBudgetCategory = async (id: string) => {
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

export const updateBudgetCategory = async (id: string, name: string, description: string) => {
    try {
        const result = await db.budgetCategory.update({
            where: {
                id
            },
            data: {
                name,
                description
            }
        })

        return result
    } catch (error) {
        return { error : "Error al actualizar la categoría" }
    }
}

export const createBudgetCategory = async (name: string, description: string) => {
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