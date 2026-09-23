"use server"

import { getBudgetAdminSession } from "@/lib/budget-admin"
import { db } from "@/lib/db"
import { BudgetCategoryIdSchema } from "@/schemas/budget-category"

export default async function deleteBudgetCategory(id: string) {
    const admin = await getBudgetAdminSession()
    if ("error" in admin) return { error: admin.error }

    const validatedId = BudgetCategoryIdSchema.safeParse(id)
    if (!validatedId.success) return { error: "Categoría inválida" }

    try {
        const category = await db.budgetCategory.delete({
            where: {
                id: validatedId.data
            }
        })

        return { category }
    } catch {
        return { error : "Error al eliminar la categoría" }
    }
}
