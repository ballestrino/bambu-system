import "server-only"

import { getBudgetAdminSession } from "@/lib/budget-admin"
import { db } from "@/lib/db"
import { BudgetCategoryIdSchema } from "@/schemas/budget-category"

export const getBudgetCategories = async () => {
    try {
        const admin = await getBudgetAdminSession()
        if ("error" in admin) return { error: admin.error }

        const result = await db.budgetCategory.findMany({
            where: {
                parentCategoryId: null
            },
            include: {
                _count: {
                    select: {
                        childCategories: true
                    }
                }
            }
        })

        return result
    } catch {
        return { error : "Error al obtener las categorías" }
    }
}

export const getBudgetCategoryById = async (id: string) => {
    try {
        const admin = await getBudgetAdminSession()
        if ("error" in admin) return { error: admin.error }

        const parsedId = BudgetCategoryIdSchema.safeParse(id)
        if (!parsedId.success) return { error: "Categoría inválida" }

        const result = await db.budgetCategory.findUnique({
            where: {
                id: parsedId.data
            }
        })

        return {category : result}
    } catch {
        return { error : "Error al obtener la categoría" }
    }
}

export const getBudgetSubCategories = async (parentId: string) => {
    try {
        const admin = await getBudgetAdminSession()
        if ("error" in admin) return { error: admin.error }

        const parsedId = BudgetCategoryIdSchema.safeParse(parentId)
        if (!parsedId.success) return { error: "Categoría inválida" }

        const result = await db.budgetCategory.findMany({
            where: {
                parentCategoryId: parsedId.data
            },
            include : {
                _count: {
                    select: {
                        childCategories: true
                    }
                }
            }
        })
        return result
    } catch {
        return { error: "Error al obtener las subcategorías" }
    }
}
