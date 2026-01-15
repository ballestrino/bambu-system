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

interface BudgetCostsSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    values: BudgetFormValues;
}

export const BudgetCostsSection = ({ isOpen, onToggle, values }: BudgetCostsSectionProps) => {
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
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
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
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="revenue_percent"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ganancia (%)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="iva"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>IVA (%)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </BudgetSection>
    );
};
