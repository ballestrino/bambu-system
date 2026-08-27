"use client";

import { Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { BudgetDropdown } from "./BudgetDropdown";
import { hexToRgba } from "@/lib/utils";
import { GeneratorOfficialControl } from "@/components/official-budgets/official-budget-controls";
import type { GeneratorBudgetListItem } from "@/components/budgets/interfaces/generator-budget";

// If date-fns is not available, I'll use a helper.
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

interface BudgetCardProps {
    budget: GeneratorBudgetListItem;
}

export function BudgetCard({ budget }: BudgetCardProps) {
    return (
        <Card className="hover:bg-muted/50 transition-colors h-full relative group">
            <CardHeader className="space-y-1 pr-4 ">
                    <div className="flex items-start justify-between gap-2">
                        <Link href={`/dashboard/budgets/budget/${budget.slug}`} className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold  leading-tight">
                            {budget.name}
                        </h3>
                        {budget.description && (
                            <CardDescription className="line-clamp-2 text-sm">
                                {budget.description}
                            </CardDescription>
                        )}
                        </Link>
                        <div>
                            <BudgetDropdown budget={budget} />
                        </div>
                    </div>
            </CardHeader>

            <CardContent>
                    <div className="space-y-2">
                        <div>
                            <GeneratorOfficialControl
                                sourceBudgetId={budget.id}
                                officialBudget={budget.officialBudget}
                                compact
                            />
                        </div>
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
        </Card>
    );
}
