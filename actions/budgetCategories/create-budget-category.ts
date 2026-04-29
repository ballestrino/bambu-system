"use server"

import { db } from "@/lib/db"

export interface CreateBudgetCategoryValues {
    name: string
    description: string
    color: string
    isActive: boolean
    parentCategoryId?: string
}

export default async function createBudgetCategory(data: CreateBudgetCategoryValues) {

    const trimedName = data.name.trim()
    try {
        const exists = await db.budgetCategory.findFirst({
            where: {
                name: {
                    equals: trimedName,
                    mode: "insensitive"
                },
                parentCategoryId: data.parentCategoryId ?? null
            },
        })

        if (exists) {
            return { error: "La categoría ya existe" }
        }

        const category = await db.budgetCategory.create({
         data : { 
            name : trimedName,
            description : data.description.trim(),
            color : data.color,
            isActive : data.isActive,
            parentCategoryId : data.parentCategoryId
         }
        })

        return { category }
    } catch {
        return { error : "Error al crear la categoría" }
    }
}