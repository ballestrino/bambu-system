"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react" // Removed Edit for now as it wasn't requested in detail
import { BudgetCategory } from "@prisma/client"
import { useRef, MouseEvent } from "react"
import DeleteDialog from "@/components/ui/delete-dialog"
import { useDeleteBudgetCategoryMutation } from "./hooks/useDeleteBudgetCategoryMutation"

interface BudgetCategoryDropdownProps {
    category: BudgetCategory
}

export function BudgetCategoryDropdown({ category }: BudgetCategoryDropdownProps) {
    const deleteTriggerRef = useRef<HTMLButtonElement>(null)
    const { mutateAsync: deleteCategoryAsync } = useDeleteBudgetCategoryMutation()

    const handleDelete = async () => {
        await deleteCategoryAsync(category.id)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => e.preventDefault()}
                    >
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        variant="destructive"
                        className="text-destructive focus:text-destructive"
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            deleteTriggerRef.current?.click()
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar categoría</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Delete Dialog */}
            <div className="hidden">
                <DeleteDialog
                    trigger={<button ref={deleteTriggerRef}>Trigger</button>}
                    title="Eliminar Categoría"
                    description={`¿Estás seguro que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`}
                    onConfirm={handleDelete}
                    deleteButtonText="Eliminar"
                />
            </div>
        </>
    )
}
