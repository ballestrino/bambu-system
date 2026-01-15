"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { BudgetFilters } from "@/components/budgets/interfaces/budget-filters"

export const getBudgets = async (
    query?: string, 
    page: number = 1, 
    limit: number = 9,
    filters?: Omit<BudgetFilters, 'query' | 'limit' | 'page'>
) => {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "No estas autenticado" };
        }

        const terms = query?.split(" ").filter(Boolean) || [];
        
        // Construct filter conditions for Budget (top level)
        const budgetConditions: any[] = [];
        
        // Date Range
        if (filters?.startDate || filters?.endDate) {
            budgetConditions.push({
                updatedAt: {
                    gte: filters.startDate ? new Date(filters.startDate) : undefined,
                    lte: filters.endDate ? new Date(filters.endDate) : undefined
                }
            });
        }

        // Search Terms
        if (terms.length > 0) {
            budgetConditions.push({
                AND: terms.map(term => ({
                    OR: [
                        { name: { contains: term, mode: "insensitive" as const } },
                        { description: { contains: term, mode: "insensitive" as const } }
                    ]
                }))
            });
        }

        // Construct filter conditions for BudgetOptions (nested)
        const optionConditions: any[] = [];

        if (filters?.hasProducts !== undefined) {
             optionConditions.push({ has_products: filters.hasProducts });
        }

        // Price
        if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
            optionConditions.push({
                price: {
                    gte: filters.minPrice,
                    lte: filters.maxPrice
                }
            });
        }

        // Nominal Hour
        if (filters?.minNominalHour !== undefined || filters?.maxNominalHour !== undefined) {
             optionConditions.push({
                nominal_hour: {
                    gte: filters.minNominalHour,
                    lte: filters.maxNominalHour
                }
             });
        }

        // Visits
        if (filters?.minVisits !== undefined || filters?.maxVisits !== undefined) {
             optionConditions.push({
                visits: {
                    gte: filters.minVisits,
                    lte: filters.maxVisits
                }
             });
        }

        // Hours per Visit
        if (filters?.minHoursPerVisit !== undefined || filters?.maxHoursPerVisit !== undefined) {
             optionConditions.push({
                hours_per_visit: {
                    gte: filters.minHoursPerVisit,
                    lte: filters.maxHoursPerVisit
                }
             });
        }

        // Visit Types
        if (filters?.visitTypes && filters.visitTypes.length > 0) {
             // Cast to any to avoid strict enum issues if passed as string
             optionConditions.push({
                visit_type: { in: filters.visitTypes as any }
             });
        }


        const whereClause: any = {
            userId: session.user.id,
        };

        if (budgetConditions.length > 0) {
            whereClause.AND = budgetConditions; // Use AND for top level budget conditions
        }

        if (optionConditions.length > 0) {
            whereClause.budgetOptions = {
                some: {
                    AND: optionConditions
                }
            };
        }

        const [budgets, totalCount] = await Promise.all([
            db.budget.findMany({
                where: whereClause,
                orderBy: {
                    updatedAt: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.budget.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return { 
            budgets, 
            totalCount,
            totalPages,
            currentPage: page
        };
    } catch (error) {
        console.error(error);
        return { error: "Error al obtener los presupuestos" };
    }
}