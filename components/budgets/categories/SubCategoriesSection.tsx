"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { CreateBudgetCategoryDialog } from "./CreateBudgetCategoryDialog"
import useSubCategories from "./hooks/useSubCategories"
import { BudgetCategoryCard } from "./BudgetCategoryCard"

interface SubCategoriesSectionProps {
    parentId: string
}

export function SubCategoriesSection({ parentId }: SubCategoriesSectionProps) {
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const { subCategories, isLoading } = useSubCategories(parentId)

    if (isLoading) {
        return <div>Cargando subcategorías...</div>
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Subcategorías</h2>
                <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Subcategoría
                </Button>
            </div>

            {subCategories.length === 0 ? (
                <div className="text-muted-foreground text-sm italic">
                    No hay subcategorías asociadas.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subCategories.map((category) => (
                        <BudgetCategoryCard key={category.id} category={category} />
                    ))}
                </div>
            )}

            <CreateBudgetCategoryDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                parentCategoryId={parentId}
                trigger={null}
            />
        </div>
    )
}
