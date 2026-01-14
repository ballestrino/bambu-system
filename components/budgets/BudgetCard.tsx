"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { Budget } from "@prisma/client";
import { BudgetDropdown } from "./BudgetDropdown";

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
    return (
        <Card className="hover:bg-muted/50 transition-colors h-full relative group">
            <Link href={`/dashboard/budgets/budget/${budget.slug}`}>
                <span className="sr-only">Ver presupuesto</span>

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
                    <div onClick={(e) => e.preventDefault()}>
                        <BudgetDropdown budget={budget} />
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
            </Link>
        </Card>
    );
}
