"use client"

import { SearchBar } from "@/components/ui/search-bar";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import Header from "@/components/budgets/Header";
import NoBudgets from "@/components/budgets/NoBudgets";
import useBudgets from "@/components/budgets/hooks/useBudgets";
import { useSearchParams } from "next/navigation";

export default function BudgetsPage() {
    const params = useSearchParams()
    const query = params.get("query") || "";
    const { budgets, isLoading, isError, error } = useBudgets({ query });

    return (
        <div className="container flex-col gap-8 flex">
            <Header />

            <div className="flex items-center space-x-2">
                <SearchBar placeholder="Buscar presupuestos..." />
            </div>

            {budgets.length === 0 ? (
                <NoBudgets />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {budgets.map((budget) => (
                        <BudgetCard key={budget.id} budget={budget} />
                    ))}
                </div>
            )}
        </div>
    );
}
