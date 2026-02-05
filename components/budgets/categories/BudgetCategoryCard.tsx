"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BudgetCategory } from "@prisma/client"
import { BudgetCategoryDropdown } from "./BudgetCategoryDropdown"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface BudgetCategoryCardProps {
    category: BudgetCategory
}

export function BudgetCategoryCard({ category }: BudgetCategoryCardProps) {
    return (
        <Link href={`/dashboard/budgets?categories=${category.id}`}>
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full border shadow-sm"
                                style={{ backgroundColor: category.color || "#afddb6" }}
                            />
                            {category.name}
                        </CardTitle>
                    </div>
                    <BudgetCategoryDropdown category={category} />
                </CardHeader>
                <CardContent>
                    <div className="w-full flex justify-between gap-2">
                        <CardDescription>
                            {category.description || "Sin descripción"}
                        </CardDescription>
                        {!category.isActive && <Badge variant="secondary">Inactiva</Badge>}
                    </div>
                </CardContent>
            </Card>
        </Link>

    )
}
