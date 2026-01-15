"use client";

import { useForm, FormProvider } from "react-hook-form";
import { BudgetPreview } from "@/components/budgets/create-budget/BudgetPreview";
import { BudgetFormValues, defaultBudgetValues } from "@/schemas/BudgetSchema";
import { useEffect, useState } from "react";

export const BudgetPreviewWrapper = ({ budget }: { budget: any }) => {
    // Determine the options to load.
    // If we have options, we try to find the one with products first, or default to the first one.
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    const optionsList = budget.budgetOptions || [];

    // Initialize selection
    useEffect(() => {
        if (optionsList.length > 0 && !selectedOptionId) {
            // Default to "with products" (has_products = true) if available, else first
            const defaultOption = optionsList.find((o: any) => o.has_products) || optionsList[0];
            setSelectedOptionId(defaultOption.id);
        }
    }, [optionsList, selectedOptionId]);

    const activeOption = optionsList.find((o: any) => o.id === selectedOptionId) || optionsList[0] || {};

    // Map DB values to Form Values
    const defaultValues: BudgetFormValues = {
        ...defaultBudgetValues,
        ...activeOption,
        // Ensure enums and types match exactly if needed
    };

    const form = useForm<BudgetFormValues>({
        defaultValues,
        mode: "onChange"
    });

    // Update form when active option changes
    useEffect(() => {
        if (activeOption) {
            form.reset({
                ...defaultBudgetValues,
                ...activeOption
            });
        }
    }, [activeOption, form]);

    if (!activeOption) return null;

    return (
        <div className="space-y-6">
            {/* Option Switcher */}
            {optionsList.length > 1 && (
                <div className="flex justify-center">
                    <div className="bg-muted p-1 rounded-lg inline-flex">
                        {optionsList.map((option: any) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedOptionId(option.id)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedOptionId === option.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {option.has_products ? "Con Productos" : "Sin Productos"}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <FormProvider {...form}>
                <div className="opacity-100">
                    {/* pointer-events-none removed to allow interactivity with accordion */}
                    <BudgetPreview />
                </div>
            </FormProvider>
        </div>
    );
}
