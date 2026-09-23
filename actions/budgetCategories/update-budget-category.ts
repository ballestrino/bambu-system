"use server"

import { getBudgetAdminSession } from "@/lib/budget-admin"
import { db } from "@/lib/db"
import {
    UpdateBudgetCategorySchema,
    type UpdateBudgetCategoryValues,
} from "@/schemas/budget-category"

export default async function updateBudgetCategory(values: UpdateBudgetCategoryValues) {
    const admin = await getBudgetAdminSession()
    if ("error" in admin) return { error: admin.error }

    const validatedFields = UpdateBudgetCategorySchema.safeParse(values)
    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0]?.message ?? "Campos inválidos" }
    }

    const { id, name, description, color, isActive } = validatedFields.data
    try {
        const category = await db.budgetCategory.update({
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

        return { category }
    } catch {
        return { error : "Error al actualizar la categoría" }
    }
}
