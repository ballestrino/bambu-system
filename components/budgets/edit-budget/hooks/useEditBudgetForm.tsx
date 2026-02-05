'use client'

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { calculateBudgetTotals, calculateEstimates } from "@/lib/budget-calculations";
import { BudgetFormValues, BudgetSchema } from "@/schemas/BudgetSchema";
import { useUpdateBudgetMutation } from "@/components/budgets/hooks/useUpdateBudgetMutation";
import { ExistingBudget } from "../../interfaces/edit-buget";


export const useEditBudgetForm = (budget: ExistingBudget) => {
    const router = useRouter();
    const { updateBudgetAsync, isUpdating } = useUpdateBudgetMutation();

    const handleGenerateAI = () => {
        // Mock AI generation or reuse logic if available
        console.log("AI Generation Triggered in Edit Mode");
        // For now just log, can implement filling/modifying logic later
    };

    // Determine initial values from the existing budget
    const optionWithProducts = budget.budgetOptions.find(o => o.has_products);
    const primaryOption = optionWithProducts || budget.budgetOptions[0];

    // State for the slug
    const [slug, setSlug] = useState(budget.slug);

    // State for accordion
    const [activeSection, setActiveSection] = useState<"details" | "costs" | "contributions" | "slug" | "">("details");

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(BudgetSchema) as any,
        defaultValues: {
            ...primaryOption,
            name: budget.name,
            description: budget.description || undefined,
            categoryIds: budget.budgetCategory?.map(c => c.id) || [],
            // Map booleans based on values
            incidence_enabled: Number(primaryOption.incidence_contribution) > 0,
            company_enabled: Number(primaryOption.company_contribution) > 0,
            personal_enabled: Number(primaryOption.personal_contribution) > 0,
        }
    });

    const { setValue, control, handleSubmit } = form;

    // Watch relevant fields
    const values = useWatch({ control });

    // Recalculate estimates
    useEffect(() => {
        const estimates = calculateEstimates(values as BudgetFormValues);
        setValue("transportation_cost", estimates.transportation_cost);
        setValue("products_price", estimates.products_price);
    }, [
        values.visits,
        values.visit_type,
        values.hours_per_visit,
        values.employees,
        setValue
    ]);

    // Recalculate Totals
    useEffect(() => {
        const totals = calculateBudgetTotals(values as BudgetFormValues);
        const newPrice = Number(totals.totalFinalWithProducts.toFixed(2));

        if (values.price !== newPrice) {
            setValue("price", newPrice, {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    }, [
        values.visits,
        values.visit_type,
        values.hours_per_visit,
        values.nominal_hour,
        values.employees,
        values.transportation_cost,
        values.products_price,
        values.revenue_percent,
        values.iva,
        values.personal_enabled,
        values.personal_contribution,
        values.incidence_enabled,
        values.incidence_contribution,
        values.company_enabled,
        values.company_contribution,
        setValue
    ]);

    const toggleSection = (section: "" | "details" | "costs" | "contributions" | "slug") => {
        setActiveSection(activeSection === section ? "" : section);
    };

    const onSubmit = async (data: BudgetFormValues) => {
        try {
            const result = await updateBudgetAsync({
                id: budget.id,
                slug,
                values: data
            });

            if (!result) return

            // If slug changed, redirect
            if (result.slug && result.slug !== budget.slug) {
                router.push(`/dashboard/budgets/edit/${result.slug}`);
            }
        } catch (error) {
            // Error handling is done in mutation hook mostly (toast)
            console.error(error);
        }
    };

    return {
        form,
        values,
        slug,
        setSlug,
        activeSection,
        toggleSection,
        onSubmit: handleSubmit(onSubmit),
        isPending: isUpdating,
        handleGenerateAI
    };
};
