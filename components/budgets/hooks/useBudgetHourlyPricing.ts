"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
    calculateBudgetTotals,
    calculateRevenuePercentForHourlyTarget,
    calculateRevenuePercentForServiceTarget,
} from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type PricingMode = "margin" | "hourly-target" | "service-target";
type PricingSelection = {
    mode: PricingMode;
    requestedValue: number;
};

export type BudgetHourlyPricingState = {
    canCalculate: boolean;
    minimumHourlyPrice: number;
    minimumServicePrice: number;
    targetHourlyPrice: number;
    targetServicePrice: number;
    wasClamped: boolean;
    setRevenuePercent: (value: number) => void;
    setTargetHourlyPrice: (value: number) => void;
    setTargetServicePrice: (value: number) => void;
};

const valuesDiffer = (left: number, right: number) =>
    Math.abs(left - right) > 0.000001;

export const useBudgetHourlyPricing = (
    form: UseFormReturn<BudgetFormValues>
): BudgetHourlyPricingState => {
    const values = useWatch({ control: form.control });
    const totals = useMemo(() => calculateBudgetTotals(values), [values]);
    const initialHourlyPrice = calculateBudgetTotals(
        form.getValues()
    ).hourlyPriceNoTaxService;
    const [selection, setSelection] = useState<PricingSelection>({
        mode: "margin",
        requestedValue: initialHourlyPrice,
    });
    const currentRevenuePercent = Number(values.revenue_percent) || 0;
    const targetResult = useMemo(
        () => {
            if (selection.mode === "service-target") {
                return calculateRevenuePercentForServiceTarget(
                    selection.requestedValue,
                    totals.totalHours,
                    totals.costBasisNoProducts
                );
            }

            return calculateRevenuePercentForHourlyTarget(
                selection.requestedValue,
                totals.totalHours,
                totals.costBasisNoProducts
            );
        },
        [
            selection.mode,
            selection.requestedValue,
            totals.costBasisNoProducts,
            totals.totalHours,
        ]
    );
    const targetHourlyPrice =
        selection.mode === "margin"
            ? totals.hourlyPriceNoTaxService
            : targetResult.normalizedHourlyPrice;
    const targetServicePrice =
        selection.mode === "margin"
            ? totals.priceNoTaxService
            : targetResult.normalizedServicePrice;
    const isTargetMode = selection.mode !== "margin";
    const wasClamped =
        isTargetMode && targetResult.wasClamped;

    useEffect(() => {
        if (!isTargetMode) return;

        if (!targetResult.canCalculate) {
            if (currentRevenuePercent !== 0) {
                form.setValue("revenue_percent", 0, {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            }
            return;
        }

        if (valuesDiffer(
            currentRevenuePercent,
            targetResult.revenuePercent
        )) {
            form.setValue("revenue_percent", targetResult.revenuePercent, {
                shouldDirty: true,
                shouldValidate: true,
            });
        }
    }, [
        currentRevenuePercent,
        form,
        isTargetMode,
        targetResult.canCalculate,
        targetResult.revenuePercent,
    ]);

    const setTargetHourlyPrice = useCallback(
        (value: number) => {
            const requestedHourlyPrice = Math.max(0, value);
            const result = calculateRevenuePercentForHourlyTarget(
                requestedHourlyPrice,
                totals.totalHours,
                totals.costBasisNoProducts
            );

            setSelection({
                mode: "hourly-target",
                requestedValue: requestedHourlyPrice,
            });

            if (result.canCalculate) {
                form.setValue(
                    "revenue_percent",
                    result.revenuePercent,
                    {
                        shouldDirty: true,
                        shouldValidate: true,
                    }
                );
            }
        },
        [form, totals.costBasisNoProducts, totals.totalHours]
    );

    const setTargetServicePrice = useCallback(
        (value: number) => {
            const requestedServicePrice = Math.max(0, value);
            const result = calculateRevenuePercentForServiceTarget(
                requestedServicePrice,
                totals.totalHours,
                totals.costBasisNoProducts
            );

            setSelection({
                mode: "service-target",
                requestedValue: requestedServicePrice,
            });

            if (result.canCalculate) {
                form.setValue(
                    "revenue_percent",
                    result.revenuePercent,
                    {
                        shouldDirty: true,
                        shouldValidate: true,
                    }
                );
            }
        },
        [form, totals.costBasisNoProducts, totals.totalHours]
    );

    const setRevenuePercent = useCallback(
        (value: number) => {
            setSelection((current) => ({
                ...current,
                mode: "margin",
            }));
            form.setValue("revenue_percent", Math.max(0, value), {
                shouldDirty: true,
                shouldValidate: true,
            });
        },
        [form]
    );

    return {
        canCalculate: targetResult.canCalculate,
        minimumHourlyPrice: targetResult.minimumHourlyPrice,
        minimumServicePrice: targetResult.minimumServicePrice,
        targetHourlyPrice,
        targetServicePrice,
        wasClamped,
        setRevenuePercent,
        setTargetHourlyPrice,
        setTargetServicePrice,
    };
};
