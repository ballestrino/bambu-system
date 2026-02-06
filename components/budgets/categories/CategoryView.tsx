"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { BudgetCategoryDropdown } from "@/components/budgets/categories/BudgetCategoryDropdown"
import useBudgetCategory from "./hooks/useBudgetCategory"
import { SubCategoriesSection } from "./SubCategoriesSection"

export default function CategoryView({ id }: { id: string }) {

    const { category, isLoading } = useBudgetCategory(id)
    const { category: parentCategory } = useBudgetCategory(category ? category.parentCategoryId : null)

    if (isLoading) {
        return <div className="h-full">
            <span>Cargando categoría</span>
        </div>
    }

    if (!category) {
        return (
            <div className="h-full">
                <span>La categoría no fue encontrada</span>
            </div>
        )
    }


    return (
        <div className="h-full container flex-col pb-10 px-4 gap-8 flex pt-6 ">
            <div className="flex flex-col w-full gap-4">
                <div className="flex gap-2">
                    {category.parentCategoryId && (
                        <Button variant="outline" size="sm" className="w-fit" asChild>
                            <Link href={`/dashboard/budgets/categories/${category.parentCategoryId}`}>
                                <ChevronLeft className="h-4 w-4" />
                                {parentCategory?.name}
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-fit" asChild>
                        <Link href="/dashboard/budgets/categories">
                            <ChevronLeft className="h-4 w-4" />
                            Todas las categorías
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-6 w-6 rounded-full border shadow-sm"
                            style={{ backgroundColor: category.color || "#afddb6" }}
                        />
                        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
                        {!category.isActive && <Badge variant="secondary">Inactiva</Badge>}
                    </div>
                    <div className="ml-auto">
                        <BudgetCategoryDropdown category={category} />
                    </div>
                </div>
            </div>

            <div className="grid gap-1">
                <h2 className="text-lg font-semibold">Descripción</h2>
                <p className="text-muted-foreground">{category.description || "Sin descripción"}</p>
            </div>

            <SubCategoriesSection parentId={category.id} />

            {/* <div className="space-y-4">
                <h2 className="text-lg font-semibold">Presupuestos Asociados ({category.budgets.length})</h2>
                {category.budgets.length === 0 ? (
                    <div className="text-muted-foreground">No hay presupuestos en esta categoría.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {category.budgets.map((budget) => (
                            <BudgetCard key={budget.id} budget={budget} />
                        ))}
                    </div>
                )}
            </div> */}
        </div>
    )
}
