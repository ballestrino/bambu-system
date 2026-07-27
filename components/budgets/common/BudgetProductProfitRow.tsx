import { cn } from "@/lib/utils";

interface BudgetProductProfitRowProps {
    amount: number;
    percentage: number;
}

export const BudgetProductProfitRow = ({
    amount,
    percentage,
}: BudgetProductProfitRowProps) => (
    <div
        className={cn(
            "flex justify-between text-sm",
            percentage > 0 ? "text-green-600" : "text-muted-foreground"
        )}
    >
        <span>
            {percentage > 0
                ? `Ganancia Prod. (${percentage}%)`
                : "Ganancia Prod. desactivada"}
        </span>
        <span>${amount.toFixed(2)}</span>
    </div>
);
