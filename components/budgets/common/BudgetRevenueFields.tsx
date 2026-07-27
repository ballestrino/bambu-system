"use client";

import { BudgetTargetPriceField } from "@/components/budgets/common/BudgetTargetPriceField";
import type { BudgetHourlyPricingState } from "@/components/budgets/hooks/useBudgetHourlyPricing";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PRODUCT_MARGIN_PCT } from "@/lib/budget-calculations";
import { cn } from "@/lib/utils";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";
import { useFormContext } from "react-hook-form";

interface BudgetRevenueFieldsProps {
    pricing: BudgetHourlyPricingState;
}

export const BudgetRevenueFields = ({
    pricing,
}: BudgetRevenueFieldsProps) => {
    const { control } = useFormContext<BudgetFormValues>();

    return (
        <>
            <BudgetTargetPriceField pricing={pricing} target="service" />
            <BudgetTargetPriceField pricing={pricing} target="hourly" />
            <FormField
                control={control}
                name="revenue_percent"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ganancia del servicio (%)</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(event) => {
                                    const value = event.target.valueAsNumber;
                                    pricing.setRevenuePercent(
                                        Number.isFinite(value) ? value : 0
                                    );
                                }}
                            />
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
                            <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="products_revenue_percent"
                render={({ field }) => {
                    const hasProductMargin = Number(field.value) > 0;

                    return (
                        <FormItem
                            className={cn(
                                "flex items-center justify-between rounded-lg border p-4 md:col-span-2",
                                hasProductMargin &&
                                    "border-blue-500 bg-blue-50/10"
                            )}
                        >
                            <div className="space-y-1">
                                <FormLabel>Ganancia de productos</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                    {hasProductMargin
                                        ? `Aplica ${Number(field.value)}% sobre el costo.`
                                        : "Desactivada: los productos se cobran al costo."}
                                </p>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={hasProductMargin}
                                    onCheckedChange={(checked) =>
                                        field.onChange(
                                            checked ? PRODUCT_MARGIN_PCT : 0
                                        )
                                    }
                                />
                            </FormControl>
                        </FormItem>
                    );
                }}
            />
        </>
    );
};
