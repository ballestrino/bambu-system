"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BudgetCategory } from "@prisma/client"
import { BudgetCategoryDropdown } from "./BudgetCategoryDropdown"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface BudgetCategoryCardProps {
    category: BudgetCategory
}

export function BudgetCategoryCard({ category }: BudgetCategoryCardProps) {
    return (
        <Card className="h-full flex flex-col justify-between">
            <div>
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
            </div>
            <CardFooter className="flex flex-col md:flex-row gap-2 pt-4">
                <Button variant="outline" className="w-full md:w-1/2" asChild>
                    <Link href={`/dashboard/budgets?categories=${category.id}`}>
                        Presupuestos
                    </Link>
                </Button>
                <Button className="w-full md:w-1/2" asChild>
                    <Link href={`/dashboard/budgets/categories/${category.id}`}>
                        Abrir categoría
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
