import { cn } from "@/lib/utils";

interface BudgetHourlyPriceProps {
    amount: number;
    className?: string;
    label?: string;
    tone?: "blue" | "gray";
}

export const BudgetHourlyPrice = ({
    amount,
    className,
    label = "Precio Hora",
    tone = "blue",
}: BudgetHourlyPriceProps) => (
    <div className={cn("flex flex-col", className)}>
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", tone === "blue" ? "text-blue-600" : "text-gray-600")}>
            ${amount.toFixed(2)}/h
        </span>
    </div>
);
