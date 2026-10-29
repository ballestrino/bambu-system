export interface BudgetFilters { 
    catIds?: string[]
    query?: string
    limit: number
    page?: number
    // Sin estado son todos; oficial es un generador con presupuesto oficial.
    status?: "official" | "draft"

    // General
    startDate?: string
    endDate?: string
    hasProducts?: boolean

    // Prices
    minPrice?: number
    maxPrice?: number
    minProfit?: number
    maxProfit?: number
    minNominalHour?: number
    maxNominalHour?: number

    // Visits
    minVisits?: number
    maxVisits?: number
    minHoursPerVisit?: number
    maxHoursPerVisit?: number
    visitTypes?: string[] // VisitType enum
}