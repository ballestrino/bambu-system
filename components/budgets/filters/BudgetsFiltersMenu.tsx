"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { useBudgetFilters } from "./use-budget-filters"
import { GeneralFilters } from "./GeneralFilters"
import { PricesFilters } from "./PricesFilters"
import { VisitsFilters } from "./VisitsFilters"

export function BudgetsFiltersMenu() {
    const [activeTab, setActiveTab] = useState("general")
    // Use the custom hook for filter logic
    const filters = useBudgetFilters()

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div>
                    <Button variant="outline" className="shrink-0 hidden sm:flex">
                        <span className="hidden md:inline">Filtros</span>
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-4" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Filtros</h4>
                    </div>

                    {/* Custom Tabs Navigation */}
                    <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-md">
                        {["general", "prices", "visits"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === tab
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50"
                                    }`}
                            >
                                {tab === "general" && "General"}
                                {tab === "prices" && "Precios"}
                                {tab === "visits" && "Visitas"}
                            </button>
                        ))}
                    </div>

                    <div className="py-2">
                        {/* General Section */}
                        {activeTab === "general" && (
                            <GeneralFilters
                                startDate={filters.startDate}
                                setStartDate={filters.setStartDate}
                                endDate={filters.endDate}
                                setEndDate={filters.setEndDate}
                                hasProducts={filters.hasProducts}
                                setHasProducts={filters.setHasProducts}
                                limit={filters.limit}
                                setLimit={filters.setLimit}
                            />
                        )}

                        {/* Prices Section */}
                        {activeTab === "prices" && (
                            <PricesFilters
                                minPrice={filters.minPrice}
                                setMinPrice={filters.setMinPrice}
                                maxPrice={filters.maxPrice}
                                setMaxPrice={filters.setMaxPrice}
                                minProfit={filters.minProfit}
                                setMinProfit={filters.setMinProfit}
                                maxProfit={filters.maxProfit}
                                setMaxProfit={filters.setMaxProfit}
                                minNominalHour={filters.minNominalHour}
                                setMinNominalHour={filters.setMinNominalHour}
                                maxNominalHour={filters.maxNominalHour}
                                setMaxNominalHour={filters.setMaxNominalHour}
                            />
                        )}

                        {/* Visits Section */}
                        {activeTab === "visits" && (
                            <VisitsFilters
                                visitType={filters.visitType}
                                setVisitType={filters.setVisitType}
                                minVisits={filters.minVisits}
                                setMinVisits={filters.setMinVisits}
                                maxVisits={filters.maxVisits}
                                setMaxVisits={filters.setMaxVisits}
                                minHoursPerVisit={filters.minHoursPerVisit}
                                setMinHoursPerVisit={filters.setMinHoursPerVisit}
                                maxHoursPerVisit={filters.maxHoursPerVisit}
                                setMaxHoursPerVisit={filters.setMaxHoursPerVisit}
                            />
                        )}
                    </div>

                    <div className="flex justify-between pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={filters.clearFilters}>
                            Limpiar
                        </Button>
                        <Button size="sm" onClick={filters.applyFilters}>
                            Aplicar
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
