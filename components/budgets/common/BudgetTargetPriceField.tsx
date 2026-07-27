"use client";

import { useRef, useState } from "react";

import type { BudgetHourlyPricingState } from "@/components/budgets/hooks/useBudgetHourlyPricing";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BudgetTargetPriceFieldProps {
    pricing: BudgetHourlyPricingState;
    target: "hourly" | "service";
}

const formatHourlyPrice = (value: number) =>
    Number.isFinite(value) ? value.toFixed(2) : "";

export const BudgetTargetPriceField = ({
    pricing,
    target,
}: BudgetTargetPriceFieldProps) => {
    const [draft, setDraft] = useState<string | null>(null);
    const wasEdited = useRef(false);
    const isServiceTarget = target === "service";
    const targetValue = isServiceTarget
        ? pricing.targetServicePrice
        : pricing.targetHourlyPrice;
    const minimumValue = isServiceTarget
        ? pricing.minimumServicePrice
        : pricing.minimumHourlyPrice;
    const formattedHourlyPrice = formatHourlyPrice(
        targetValue
    );

    return (
        <FormItem>
            <FormLabel htmlFor={`target-${target}-price`}>
                {isServiceTarget
                    ? "Precio objetivo"
                    : "Precio hora objetivo"}
            </FormLabel>
            <Input
                id={`target-${target}-price`}
                type="number"
                min="0"
                step="0.01"
                value={draft ?? formattedHourlyPrice}
                disabled={!pricing.canCalculate}
                onBlur={(event) => {
                    const value = event.currentTarget.valueAsNumber;
                    const shouldCommit = wasEdited.current;
                    wasEdited.current = false;
                    setDraft(null);
                    if (shouldCommit && Number.isFinite(value)) {
                        if (isServiceTarget) {
                            pricing.setTargetServicePrice(value);
                        } else {
                            pricing.setTargetHourlyPrice(value);
                        }
                    }
                }}
                onChange={(event) => {
                    wasEdited.current = true;
                    setDraft(event.currentTarget.value);
                }}
                onFocus={(event) => {
                    wasEdited.current = false;
                    setDraft(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                    }
                }}
            />
            <p
                className={cn(
                    "text-xs text-muted-foreground",
                    pricing.wasClamped && "text-amber-600"
                )}
            >
                {pricing.wasClamped
                    ? `Ajustado al costo mínimo de $${minimumValue.toFixed(2)}${isServiceTarget ? "" : "/h"} (0% de ganancia).`
                    : pricing.canCalculate
                      ? isServiceTarget
                          ? "Total del servicio sin IVA ni productos."
                          : "Sin IVA ni productos; ajusta la ganancia del servicio."
                      : "Completa horas y costos para definir el objetivo."}
            </p>
        </FormItem>
    );
};
