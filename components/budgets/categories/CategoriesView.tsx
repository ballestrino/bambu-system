"use client"

import useBudgetCategories from "./hooks/useBudgetCategories"
import { BudgetCategoryCard } from "./BudgetCategoryCard"
import { CreateBudgetCategoryDialog } from "./CreateBudgetCategoryDialog"
import { Skeleton } from "@/components/ui/skeleton"

export function CategoriesView() {
    const { categories, isLoading, isError } = useBudgetCategories()

    if (isLoading) {
        return (
            <div className="container w-full space-y-4">
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    if (isError) {
        return <div className="container w-full text-red-500">Error al cargar las categorías</div>
    }

    return (
        <div className="container w-full space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Categorías</h2>
                    <p className="text-muted-foreground text-sm">Gestiona las categorías de tus presupuestos</p>
                </div>
                <CreateBudgetCategoryDialog />
            </div>

            {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border rounded-lg border-dashed bg-muted/20">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">No hay categorías</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Crea categorías para organizar mejor tus presupuestos.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <BudgetCategoryCard key={category.id} category={category} />
                    ))}
                </div>
            )}
        </div>
    )
}
