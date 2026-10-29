import "server-only"

import { db } from "@/lib/db"
import { getBudgetAdminSession } from "@/lib/budget-admin"
import { BudgetFilters } from "@/components/budgets/interfaces/budget-filters"
import { budgetStatusWhere, buildBudgetListWhere } from "@/data/budget-list-where"

import {
    generatorBudgetListInclude,
    type BudgetStatusCounts,
    type GeneratorBudgetListItem,
} from "@/components/budgets/interfaces/generator-budget"

export const getBudgets = async (
    query?: string,
    page: number = 1,
    limit: number = 9,
    filters?: Omit<BudgetFilters, 'query' | 'limit' | 'page'>
): Promise<{
    budgets: GeneratorBudgetListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    statusCounts: BudgetStatusCounts;
} | {
    error: string;
}> => {
    try {
        const admin = await getBudgetAdminSession();

        if ("error" in admin) {
            return { error: admin.error };
        }

        const { status, ...listFilters } = filters ?? {};
        const baseWhere = buildBudgetListWhere(query, listFilters);
        const statusWhere = budgetStatusWhere(status);
        const whereClause = statusWhere ? { AND: [baseWhere, statusWhere] } : baseWhere;

        const [budgets, totalCount, allCount, officialCount] = await Promise.all([
            db.budget.findMany({
                where: whereClause,
                orderBy: { updatedAt: 'desc' },
                include: generatorBudgetListInclude,
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.budget.count({ where: whereClause }),
            db.budget.count({ where: baseWhere }),
            db.budget.count({ where: { AND: [baseWhere, budgetStatusWhere("official")!] } }),
        ]);

        return {
            budgets,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            statusCounts: { all: allCount, draft: allCount - officialCount, official: officialCount },
        };
    } catch (error) {
        console.error(error);
        return { error: "Error al obtener los presupuestos" };
    }
}
