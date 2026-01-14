"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"

export const getBudgets = async (query?: string) => {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "No estas autenticado" };
        }

        const terms = query?.split(" ").filter(Boolean) || [];
        
        const whereClause = {
            userId: session.user.id,
            AND: terms.map(term => ({
                OR: [
                    { name: { contains: term, mode: "insensitive" as const } },
                    { description: { contains: term, mode: "insensitive" as const } }
                ]
            }))
        };

        const budgets = await db.budget.findMany({
            where: whereClause,
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return { budgets };
    } catch (error) {
        return { error: "Error al obtener los presupuestos" };
    }
}