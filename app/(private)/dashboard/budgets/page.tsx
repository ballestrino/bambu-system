"use client"

import { SearchBar } from "@/components/ui/search-bar";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import Header from "@/components/budgets/Header";
import NoBudgets from "@/components/budgets/NoBudgets";
import useBudgets from "@/components/budgets/hooks/useBudgets";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { BudgetsFiltersMenu } from "@/components/budgets/filters/BudgetsFiltersMenu";
import { QuickFilters } from "@/components/budgets/filters/QuickFilters";
import { getCookie } from "@/lib/utils";

import { Suspense } from "react";

function BudgetsPageContent() {
    const params = useSearchParams()
    const query = params.get("query") || "";
    const [page, setPage] = useState(1);
    const limit = params.get("limit") ? parseInt(params.get("limit")!) : (getCookie("budget_limit") ? parseInt(getCookie("budget_limit")!) : 10);

    // Parse filters
    const startDate = params.get("startDate") || undefined;
    const endDate = params.get("endDate") || undefined;
    const hasProducts = params.get("hasProducts") === "true" ? true : params.get("hasProducts") === "false" ? false : undefined;
    const minPrice = params.get("minPrice") ? Number(params.get("minPrice")) : undefined;
    const maxPrice = params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined;
    const minProfit = params.get("minProfit") ? Number(params.get("minProfit")) : undefined;
    const maxProfit = params.get("maxProfit") ? Number(params.get("maxProfit")) : undefined;
    const minNominalHour = params.get("minNominalHour") ? Number(params.get("minNominalHour")) : undefined;
    const maxNominalHour = params.get("maxNominalHour") ? Number(params.get("maxNominalHour")) : undefined;
    const minVisits = params.get("minVisits") ? Number(params.get("minVisits")) : undefined;
    const maxVisits = params.get("maxVisits") ? Number(params.get("maxVisits")) : undefined;
    const minHoursPerVisit = params.get("minHoursPerVisit") ? Number(params.get("minHoursPerVisit")) : undefined;
    const maxHoursPerVisit = params.get("maxHoursPerVisit") ? Number(params.get("maxHoursPerVisit")) : undefined;
    const visitTypes = params.get("visitTypes") ? [params.get("visitTypes")!] : undefined;


    useEffect(() => {
        setPage(1);
    }, [query]);

    const filters = {
        query,
        page,
        limit,
        startDate,
        endDate,
        hasProducts,
        minPrice,
        maxPrice,
        minProfit,
        maxProfit,
        minNominalHour,
        maxNominalHour,
        minVisits,
        maxVisits,
        minHoursPerVisit,
        maxHoursPerVisit,
        visitTypes
    };

    const { budgets, totalPages, isLoading } = useBudgets(filters);

    return (
        <div className="h-full container flex-col pb-10 px-4 gap-8 flex">
            <Header />

            <QuickFilters />

            <div className="flex items-center space-x-2">
                <div className="flex-1">
                    <SearchBar placeholder="Buscar presupuestos..." />
                </div>
                <BudgetsFiltersMenu />
            </div>

            {budgets.length === 0 && !isLoading ? (
                <NoBudgets />
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {budgets.map((budget) => (
                            <BudgetCard key={budget.id} budget={budget} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(old => Math.max(old - 1, 1))}
                                disabled={page === 1 || isLoading}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(old => Math.min(old + 1, totalPages))}
                                disabled={page === totalPages || isLoading}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function BudgetsPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <BudgetsPageContent />
        </Suspense>
    );
}
