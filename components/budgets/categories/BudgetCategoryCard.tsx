"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BudgetCategory } from "@prisma/client"
import { BudgetCategoryDropdown } from "./BudgetCategoryDropdown"

interface BudgetCategoryCardProps {
    category: BudgetCategory
}

export function BudgetCategoryCard({ category }: BudgetCategoryCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-sm font-medium">
                        {category.name}
                    </CardTitle>
                </div>
                <BudgetCategoryDropdown category={category} />
            </CardHeader>
            <CardContent>
                <CardDescription>
                    {category.description || "Sin descripción"}
                </CardDescription>
            </CardContent>
        </Card>
    )
}
