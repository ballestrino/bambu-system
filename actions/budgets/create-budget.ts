"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BudgetSchema, BudgetFormValues } from "@/schemas/BudgetSchema";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { revalidatePath } from "next/cache";

export const createBudget = async (values: BudgetFormValues) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "No autorizado" };
    }

    const validatedFields = BudgetSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Campos inválidos" };
    }

    const {
        name,
        description,
        visits,
        visit_type,
        hours_per_visit,
        nominal_hour,
        nominal_salary,
        employees,
        incidence_contribution,
        incidence_enabled,
        company_contribution,
        company_enabled,
        personal_contribution,
        personal_enabled,
        transportation_cost,
        products_price,
        products_iva,
        products_revenue_percent,
        revenue_percent,
        price,
        iva,
    } = validatedFields.data;

    // Calculate totals to derive the price without products
    const totals = calculateBudgetTotals(validatedFields.data);
    const { priceNoTaxService, revenueAmountService, revenueAmountProducts } = totals;

    try {
        // Generate Slug
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Check uniqueness
        const existingBudget = await db.budget.findUnique({
             where: { slug }
        });

        console.log(slug) 
        console.log(existingBudget)

        if (existingBudget) {
            return { error: "Este título ya está en uso. Por favor elige otro nombre para tu presupuesto." };
        }

        const budget = await db.budget.create({
            data: {
                name,
                description,
                slug,
                userId: session.user.id,
                budgetOptions: {
                    create: [
                        // Option 1: With Products (Only if products exist)
                        ...(products_price > 0 ? [{
                            has_products: true,
                            visits,
                            visit_type,
                            hours_per_visit,
                            nominal_hour,
                            nominal_salary,
                            employees,
                            incidence_contribution: incidence_enabled ? incidence_contribution : 0,
                            company_contribution: company_enabled ? company_contribution : 0,
                            personal_contribution: personal_enabled ? personal_contribution : 0,
                            transportation_cost,
                            products_price,
                            products_iva,
                            products_revenue_percent,
                            revenue_percent,
                            price,
                            profit: revenueAmountService + revenueAmountProducts,
                            iva,
                        }] : []),
                        // Option 2: Without Products (Always created as base option)
                        {
                            has_products: false,
                            visits,
                            visit_type,
                            hours_per_visit,
                            nominal_hour,
                            nominal_salary,
                            employees,
                            incidence_contribution: incidence_enabled ? incidence_contribution : 0,
                            company_contribution: company_enabled ? company_contribution : 0,
                            personal_contribution: personal_enabled ? personal_contribution : 0,
                            transportation_cost,
                            products_price: 0,
                            products_iva: 0,
                            products_revenue_percent: 0,
                            revenue_percent,
                            price: priceNoTaxService + (priceNoTaxService * (iva / 100)), // Calculated price without products
                            profit: revenueAmountService,
                            iva,
                        }
                    ]
                }
            }
        });

        revalidatePath("/dashboard/budgets");
        return { success: "exito", budget: budget };
    } catch (error) {
        console.error("Error creating budget:", error);
        return { error: "error" };
    }
};

