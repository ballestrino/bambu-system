"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Budget } from "@prisma/client"
import { useRef, MouseEvent } from "react"
import DeleteDialog from "@/components/ui/delete-dialog"
import { useDeleteBudgetMutation } from "./hooks/useDeleteBudgetMutation"
import Link from "next/link"

interface BudgetDropdownProps {
    budget: Budget
}

export function BudgetDropdown({ budget }: BudgetDropdownProps) {
    const deleteTriggerRef = useRef<HTMLButtonElement>(null)
    const { deleteBudgetAsync } = useDeleteBudgetMutation()
    const handleDelete = async () => {
        await deleteBudgetAsync(budget.id)
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
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            // Edit action logic here
                            console.log("Edit clicked")
                        }}
                    >
                        <Link className="flex gap-2" href={`/dashboard/budgets/edit/${budget.slug}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar presupuesto</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        className="text-destructive focus:text-destructive"
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            deleteTriggerRef.current?.click()
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar presupuesto</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Delete Dialog */}
            <div className="hidden">
                <DeleteDialog
                    trigger={<button ref={deleteTriggerRef}>Trigger</button>}
                    title="Eliminar Presupuesto"
                    description={`¿Estás seguro que deseas eliminar el presupuesto "${budget.name}"? Esta acción no se puede deshacer.`}
                    onConfirm={handleDelete}
                    deleteButtonText="Eliminar"
                />
            </div>
        </>
    )
}
