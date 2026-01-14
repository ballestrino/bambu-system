import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { Budget } from "@prisma/client";

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
        <Link href={`/dashboard/budgets/budget/${budget.slug}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">{budget.name}</CardTitle>
                    {budget.description && (
                        <CardDescription className="line-clamp-2">
                            {budget.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(budget.updatedAt)}</span>
                        </div>
                        {/* Add more info if available, e.g. total amount if pre-calculated */}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
