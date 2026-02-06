"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { Budget } from "@prisma/client";
import { BudgetDropdown } from "./BudgetDropdown";
import { hexToRgba } from "@/lib/utils";

// If date-fns is not available, I'll use a helper.
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

interface BudgetCardProps {
    budget: Budget & {
        budgetCategory?: Array<{
            id: string;
            name: string;
            color?: string | null;
        }>;
    };
}

export function BudgetCard({ budget }: BudgetCardProps) {
    return (
        <Card className="hover:bg-muted/50 transition-colors h-full relative group">
            <Link href={`/dashboard/budgets/budget/${budget.slug}`}>
                <span className="sr-only">Ver presupuesto</span>

                <CardHeader className="space-y-1 pr-4 ">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold  leading-tight">
                            {budget.name}
                        </h3>
                        <div onClick={(e) => e.preventDefault()}>
                            <BudgetDropdown budget={budget} />
                        </div>
                    </div>
                    {budget.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                            {budget.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{formatDate(budget.updatedAt)}</span>
                            </div>
                        </div>

                        {budget.budgetCategory && budget.budgetCategory.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {budget.budgetCategory.map((category) => (
                                    <Badge
                                        key={category.id}
                                        variant="secondary"
                                        className="text-xs"
                                        style={
                                            category.color
                                                ? { backgroundColor: hexToRgba(category.color, 0.2) }
                                                : {}
                                        }
                                    >
                                        {category.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}
