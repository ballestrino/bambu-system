import { Prisma, VisitType } from "@prisma/client"

import type { BudgetFilters } from "@/components/budgets/interfaces/budget-filters"

type ListFilters = Omit<BudgetFilters, "query" | "limit" | "page" | "status">

const range = (min?: number, max?: number) =>
    min !== undefined || max !== undefined ? { gte: min, lte: max } : undefined

const isVisitType = (value: string): value is VisitType =>
    value === "days" || value === "week" || value === "month"

// Todo lo que filtra la lista menos el estado (oficial o borrador): con esta
// base se cuentan las pestañas.
export const buildBudgetListWhere = (query?: string, filters?: ListFilters): Prisma.BudgetWhereInput => {
    const terms = query?.split(" ").filter(Boolean) || []
    const budgetConditions: Prisma.BudgetWhereInput[] = []
    const optionConditions: Prisma.BudgetOptionWhereInput[] = []

    if (filters?.startDate || filters?.endDate) {
        budgetConditions.push({
            updatedAt: {
                gte: filters.startDate ? new Date(filters.startDate) : undefined,
                lte: filters.endDate ? new Date(filters.endDate) : undefined,
            },
        })
    }

    if (terms.length > 0) {
        budgetConditions.push({
            AND: terms.map((term) => ({
                OR: [
                    { name: { contains: term, mode: "insensitive" as const } },
                    { description: { contains: term, mode: "insensitive" as const } },
                ],
            })),
        })
    }

    if (filters?.hasProducts === true) optionConditions.push({ has_products: true })
    if (filters?.hasProducts === false) {
        // Sin productos: la opción de servicio y ninguna opción con productos.
        optionConditions.push({ has_products: false })
        budgetConditions.push({ budgetOptions: { none: { has_products: true } } })
    }

    const ranges: Array<[keyof Prisma.BudgetOptionWhereInput, ReturnType<typeof range>]> = [
        ["profit", range(filters?.minProfit, filters?.maxProfit)],
        ["price", range(filters?.minPrice, filters?.maxPrice)],
        ["nominal_hour", range(filters?.minNominalHour, filters?.maxNominalHour)],
        ["visits", range(filters?.minVisits, filters?.maxVisits)],
        ["hours_per_visit", range(filters?.minHoursPerVisit, filters?.maxHoursPerVisit)],
    ]
    ranges.forEach(([field, value]) => {
        if (value) optionConditions.push({ [field]: value })
    })

    const visitTypes = filters?.visitTypes?.filter(isVisitType) ?? []
    if (visitTypes.length > 0) optionConditions.push({ visit_type: { in: visitTypes } })

    if (filters?.catIds && filters.catIds.length > 0) {
        budgetConditions.push({ budgetCategory: { some: { id: { in: filters.catIds } } } })
    }

    const where: Prisma.BudgetWhereInput = {}
    if (budgetConditions.length > 0) where.AND = budgetConditions
    if (optionConditions.length > 0) where.budgetOptions = { some: { AND: optionConditions } }
    return where
}

// Oficial es un generador con un presupuesto oficial vinculado.
export const budgetStatusWhere = (status: BudgetFilters["status"]): Prisma.BudgetWhereInput | undefined => {
    if (status === "official") return { officialBudget: { isNot: null } }
    if (status === "draft") return { officialBudget: { is: null } }
    return undefined
}
