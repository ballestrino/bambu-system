"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Budget } from "@prisma/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/delete-dialog";
import deleteBudget from "@/actions/budgets/delete-budget";
import { useRef, MouseEvent } from "react";
import { toast } from "sonner";

// If date-fns is not available, I'll use a helper.
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

interface BudgetCardProps {
    budget: Budget;
}

export function BudgetCard({ budget }: BudgetCardProps) {
    const deleteTriggerRef = useRef<HTMLButtonElement>(null);

    const handleDelete = async () => {
        const result = await deleteBudget(budget.id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Presupuesto eliminado exitosamente");
        }
    };

    return (
        <Card className="hover:bg-muted/50 transition-colors h-full relative group">
            <Link href={`/dashboard/budgets/budget/${budget.slug}`} className="absolute inset-0 z-10">
                <span className="sr-only">Ver presupuesto</span>
            </Link>
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1 pr-4">
                    <CardTitle className="text-lg font-bold truncate leading-tight">
                        {budget.name}
                    </CardTitle>
                    {budget.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                            {budget.description}
                        </CardDescription>
                    )}
                </div>
                <div className="z-20 relative">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.preventDefault()}>
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                // Edit action logic here
                                console.log("Edit clicked");
                            }}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar presupuesto</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e: MouseEvent) => {
                                    e.stopPropagation(); // Prevent link click
                                    deleteTriggerRef.current?.click();
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar presupuesto</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(budget.updatedAt)}</span>
                    </div>
                </div>
            </CardContent>

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
        </Card>
    );
}
