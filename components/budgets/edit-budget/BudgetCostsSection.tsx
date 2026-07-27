"use client";

import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BudgetFormValues } from "@/schemas/BudgetSchema";
import { BudgetSection } from "./BudgetSection";
import { AutoCalculateButton } from "../common/AutoCalculateButton";
import { BudgetRevenueFields } from "../common/BudgetRevenueFields";
import type { BudgetHourlyPricingState } from "../hooks/useBudgetHourlyPricing";

interface BudgetCostsSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    values: BudgetFormValues;
    onAutoCalculateTransport: () => void;
    onAutoCalculateProducts: () => void;
    hourlyPricing: BudgetHourlyPricingState;
}

export const BudgetCostsSection = ({
    isOpen,
    onToggle,
    values,
    onAutoCalculateTransport,
    onAutoCalculateProducts,
    hourlyPricing
}: BudgetCostsSectionProps) => {
    const { control } = useFormContext<BudgetFormValues>();

    return (
        <BudgetSection
            title="Costos e Ingresos"
            isOpen={isOpen}
            onToggle={onToggle}
            summary={
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-muted-foreground block text-xs">Costo Transporte</span>
                        <span className="font-medium text-foreground">${values.transportation_cost || 0}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Costo Productos</span>
                        <span className="font-medium text-foreground">${values.products_price || 0}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Ganancia</span>
                        <span className="font-medium text-foreground">{values.revenue_percent || 0}%</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Ganancia Productos</span>
                        <span className="font-medium text-foreground">
                            {Number(values.products_revenue_percent) > 0
                                ? `${values.products_revenue_percent}%`
                                : "No"}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">IVA</span>
                        <span className="font-medium text-foreground">{values.iva || 0}%</span>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                    control={control}
                    name="transportation_cost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Costo Transporte</FormLabel>
                            <div className="flex gap-2 items-start">
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <AutoCalculateButton onAutoCalculate={onAutoCalculateTransport} />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="products_price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Costo de Productos</FormLabel>
                            <div className="flex gap-2 items-start">
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <AutoCalculateButton onAutoCalculate={onAutoCalculateProducts} />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <BudgetRevenueFields pricing={hourlyPricing} />
            </div>
        </BudgetSection>
    );
};
