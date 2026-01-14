
import { getBudgets } from "@/data/budgets";
import { SearchBar } from "@/components/ui/search-bar";
import { BudgetCard } from "@/components/budgets/budget-card";
import Header from "@/components/budgets/Header";
import NoBudgets from "@/components/budgets/NoBudgets";

export default async function BudgetsPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const params = await searchParams;
    const query = params?.query || "";
    const budgets = await getBudgets(query);

    return (
        <div className="h-full container flex-1 flex-col space-y-8 md:flex">
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
