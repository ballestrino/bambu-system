"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, Pencil, Copy } from "lucide-react"
import { BudgetCategory } from "@prisma/client"
import { useRef, MouseEvent, useState } from "react"
import DeleteDialog from "@/components/ui/delete-dialog"
import { useDeleteBudgetCategoryMutation } from "./hooks/useDeleteBudgetCategoryMutation"
import { CreateBudgetCategoryDialog } from "./CreateBudgetCategoryDialog"
import { toast } from "sonner"

interface BudgetCategoryDropdownProps {
    category: BudgetCategory
}

export function BudgetCategoryDropdown({ category }: BudgetCategoryDropdownProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const deleteTriggerRef = useRef<HTMLButtonElement>(null)
    const { mutateAsync: deleteCategoryAsync } = useDeleteBudgetCategoryMutation()

    const handleDelete = async () => {
        await deleteCategoryAsync(category.id)
    }

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Abrir menu"
                        onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowEditDialog(true)
                        }}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar categoría</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.preventDefault() // Keep menu open? No, we likely want to close. But sticking to existing pattern.
                            // Actually, let's try to remove preventDefault to see if it closes.
                            // But user code for Edit has it.
                            // Edit opens a dialog, so closing dropdown is visual.
                            // For Copy, we want to copy and be done.
                            // If I use preventDefault, it might stay open.
                            // I will use preventDefault AND stopPropagation, then manually close?
                            // No, simpler: Just stopPropagation.
                            // But wait, the standard shadcn DropdownMenuItem wraps a primitive that handles clicks.
                            // If I stop prop, does the primitive see it? Yes, bubbling starts from target.
                            // So stopPropagation stops it going FURTHER up.
                            // The MenuItem itself handles the click.
                            // So just stopPropagation is correct for the Link issue.

                            e.stopPropagation()
                            const color = category.color || "#afddb6"
                            navigator.clipboard.writeText(color)
                            toast.success("Color copiado", {
                                description: color
                            })
                        }}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copiar color</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        className="text-destructive focus:text-destructive"
                        onClick={(e: MouseEvent) => {
                            e.preventDefault()
                            e.stopPropagation()
                            deleteTriggerRef.current?.click()
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar categoría</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <CreateBudgetCategoryDialog
                trigger={null}
                category={category}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

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
