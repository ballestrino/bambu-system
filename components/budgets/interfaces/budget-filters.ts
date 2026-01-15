export interface BudgetFilters { 
    query?: string
    limit: number
    page?: number

    // General
    startDate?: string
    endDate?: string
    hasProducts?: boolean

    // Prices
    minPrice?: number
    maxPrice?: number
    minNominalHour?: number
    maxNominalHour?: number

    // Visits
    minVisits?: number
    maxVisits?: number
    minHoursPerVisit?: number
    maxHoursPerVisit?: number
    visitTypes?: string[] // VisitType enum
}