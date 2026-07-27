import { BudgetHourlyPrice } from "@/components/budgets/common/BudgetHourlyPrice";

interface BudgetHourlyPriceComparisonProps {
    hourlyPriceWithProducts: number;
    hourlyPriceWithoutProducts: number;
    hasProducts: boolean;
}

export const BudgetHourlyPriceComparison = ({
    hourlyPriceWithProducts,
    hourlyPriceWithoutProducts,
    hasProducts,
}: BudgetHourlyPriceComparisonProps) => (
    <>
        <BudgetHourlyPrice
            amount={hourlyPriceWithoutProducts}
            label="Precio/hora sin productos"
            tone="gray"
        />
        {hasProducts ? (
            <BudgetHourlyPrice
                amount={hourlyPriceWithProducts}
                label="Precio/hora con productos"
            />
        ) : (
            <div className="flex flex-col">
                <span className="text-muted-foreground">
                    Precio/hora con productos
                </span>
                <span className="text-muted-foreground">No aplica</span>
            </div>
        )}
    </>
);
