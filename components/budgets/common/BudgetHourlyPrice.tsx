import { cn } from "@/lib/utils";

interface BudgetHourlyPriceProps {
    amount: number;
    className?: string;
    tone?: "blue" | "gray";
}

export const BudgetHourlyPrice = ({
    amount,
    className,
    tone = "blue",
}: BudgetHourlyPriceProps) => (
    <div className={cn("flex flex-col", className)}>
        <span className="text-muted-foreground">Precio Hora</span>
        <span className={cn("font-medium", tone === "blue" ? "text-blue-600" : "text-gray-600")}>
            ${amount.toFixed(2)}/h
        </span>
    </div>
);
