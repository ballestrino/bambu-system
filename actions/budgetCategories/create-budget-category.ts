"use server"

import { getBudgetAdminSession } from "@/lib/budget-admin"
import { db } from "@/lib/db"
import {
    CreateBudgetCategorySchema,
    type CreateBudgetCategoryValues,
} from "@/schemas/budget-category"

export default async function createBudgetCategory(data: CreateBudgetCategoryValues) {
    const admin = await getBudgetAdminSession()
    if ("error" in admin) return { error: admin.error }

    const validatedFields = CreateBudgetCategorySchema.safeParse(data)
    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0]?.message ?? "Campos inválidos" }
    }

    const { name, description, color, isActive, parentCategoryId } = validatedFields.data
    try {
        const exists = await db.budgetCategory.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                },
                parentCategoryId: parentCategoryId ?? null
            },
        })

        if (exists) {
            return { error: "La categoría ya existe" }
        }

        const category = await db.budgetCategory.create({
         data : {
            name,
            description,
            color,
            isActive,
            parentCategoryId
         }
        })

        return { category }
    } catch {
        return { error : "Error al crear la categoría" }
    }
}
