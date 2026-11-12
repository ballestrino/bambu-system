"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
    calculateBudgetTotals,
    calculateRevenuePercentForHourlyTarget,
    calculateRevenuePercentForServiceTarget,
} from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type TargetMode = "hourly-target" | "service-target";
type PricingMode = "margin" | TargetMode;
type PricingSelection = {
    mode: PricingMode;
    requestedValue: number;
};

// Lo que muestra el selector "Definir el precio por".
export type PriceModeChoice = "margin" | "service" | "hourly";

export type BudgetHourlyPricingState = {
    canCalculate: boolean;
    minimumHourlyPrice: number;
    minimumServicePrice: number;
    targetHourlyPrice: number;
    targetServicePrice: number;
    wasClamped: boolean;
    selectMode: (mode: PriceModeChoice) => void;
    setRevenuePercent: (value: number) => void;
    setTargetHourlyPrice: (value: number) => void;
    setTargetServicePrice: (value: number) => void;
};

const setOptions = { shouldDirty: true, shouldValidate: true } as const;

const valuesDiffer = (left: number, right: number) =>
    Math.abs(left - right) > 0.000001;

const solveTarget = (mode: PricingMode, value: number, hours: number, cost: number) =>
    mode === "service-target"
        ? calculateRevenuePercentForServiceTarget(value, hours, cost)
        : calculateRevenuePercentForHourlyTarget(value, hours, cost);

// Con un precio objetivo fijado, la ganancia se recalcula cuando cambian los
// costos para que el precio no se mueva. En "margin" manda la ganancia y los
// costos mueven el precio.
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
        () =>
            solveTarget(
                selection.mode,
                selection.requestedValue,
                totals.totalHours,
                totals.costBasisNoProducts
            ),
        [selection.mode, selection.requestedValue, totals.costBasisNoProducts, totals.totalHours]
    );
    const isTargetMode = selection.mode !== "margin";
    const targetHourlyPrice = isTargetMode
        ? targetResult.normalizedHourlyPrice
        : totals.hourlyPriceNoTaxService;
    const targetServicePrice = isTargetMode
        ? targetResult.normalizedServicePrice
        : totals.priceNoTaxService;
    const wasClamped = isTargetMode && targetResult.wasClamped;

    useEffect(() => {
        if (!isTargetMode) return;

        if (!targetResult.canCalculate) {
            if (currentRevenuePercent !== 0) {
                form.setValue("revenue_percent", 0, setOptions);
            }
            return;
        }

        if (valuesDiffer(currentRevenuePercent, targetResult.revenuePercent)) {
            form.setValue("revenue_percent", targetResult.revenuePercent, setOptions);
        }
    }, [
        currentRevenuePercent,
        form,
        isTargetMode,
        targetResult.canCalculate,
        targetResult.revenuePercent,
    ]);

    const setTarget = useCallback(
        (mode: TargetMode, value: number) => {
            const requestedValue = Math.max(0, value);
            const result = solveTarget(mode, requestedValue, totals.totalHours, totals.costBasisNoProducts);
            setSelection({ mode, requestedValue });
            if (result.canCalculate) {
                form.setValue("revenue_percent", result.revenuePercent, setOptions);
            }
        },
        [form, totals.costBasisNoProducts, totals.totalHours]
    );

    const setTargetHourlyPrice = useCallback(
        (value: number) => setTarget("hourly-target", value),
        [setTarget]
    );
    const setTargetServicePrice = useCallback(
        (value: number) => setTarget("service-target", value),
        [setTarget]
    );

    const setRevenuePercent = useCallback(
        (value: number) => {
            setSelection((current) => ({ ...current, mode: "margin" }));
            form.setValue("revenue_percent", Math.max(0, value), setOptions);
        },
        [form]
    );

    // Pasar a "Ganancia" suelta el precio fijado. Entre precio total y precio
    // hora, un precio ya fijado pasa al otro con el valor que se ve: el precio
    // no salta, y desde ahí queda fijo el que dice "Lo fijás vos".
    const selectMode = useCallback(
        (mode: PriceModeChoice) => {
            if (mode === "margin") {
                setSelection((current) => ({ ...current, mode: "margin" }));
                return;
            }
            if (!isTargetMode) return;
            if (mode === "service") setTarget("service-target", targetServicePrice);
            else setTarget("hourly-target", targetHourlyPrice);
        },
        [isTargetMode, setTarget, targetHourlyPrice, targetServicePrice]
    );

    return {
        canCalculate: targetResult.canCalculate,
        minimumHourlyPrice: targetResult.minimumHourlyPrice,
        minimumServicePrice: targetResult.minimumServicePrice,
        targetHourlyPrice,
        targetServicePrice,
        wasClamped,
        selectMode,
        setRevenuePercent,
        setTargetHourlyPrice,
        setTargetServicePrice,
    };
};
