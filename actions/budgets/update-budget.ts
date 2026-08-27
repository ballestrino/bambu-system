"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BudgetSchema, BudgetFormValues } from "@/schemas/BudgetSchema";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { revalidatePath } from "next/cache";
import { appendLinkedOfficialBudgetVersion } from "@/lib/official-budgets/versioning";

export const updateBudget = async (id: string, newSlug: string, values: BudgetFormValues) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "No autorizado" };
    }
    const actorId = session.user.id;

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
        categoryIds,
    } = validatedFields.data;

    // Calculate totals to derive the price without products
    const totals = calculateBudgetTotals(validatedFields.data);
    const { priceNoTaxService, revenueAmountService, revenueAmountProducts } = totals;

    try {
        const existingBudget = await db.budget.findUnique({
            where: { id },
            include: {
                officialBudget: { select: { id: true } },
            },
        });

        if (!existingBudget) {
            return { error: "Presupuesto no encontrado" };
        }
        if (existingBudget.officialBudget && session.user.role !== "ADMIN") {
            return {
                error: "Solo un administrador puede editar un presupuesto oficial vinculado",
            };
        }

        // Check if slug changed and is unique
        if (newSlug !== existingBudget.slug) {
            const slugTaken = await db.budget.findUnique({
                where: { slug: newSlug },
            });
            if (slugTaken) {
                return { error: "Este slug/URL ya está en uso." };
            }
        }

        // Transaction: update budget and recreate options
        const updatedBudget = await db.$transaction(async (tx) => {
            // 1. Update core Budget details
            const budget = await tx.budget.update({
                where: { id },
                data: {
                    name,
                    description,
                    slug: newSlug,
                    // userId: existingBudget.userId, // Keep original owner
                    budgetCategory: categoryIds ? {
                        set: categoryIds.map((id) => ({ id }))
                    } : {
                        set: []
                    }
                },
            });

            // 2. Delete existing options
            await tx.budgetOption.deleteMany({
                where: { budgetId: id },
            });

            // 3. Create new options
            await tx.budgetOption.createMany({
                data: [
                    // Option 1: With Products (Only if products exist)
                    ...(products_price > 0 ? [{
                        budgetId: id,
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
                        budgetId: id,
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
            });

            await appendLinkedOfficialBudgetVersion(tx, id, actorId);

            return tx.budget.findUniqueOrThrow({
                where: { id: budget.id },
                include: {
                    officialBudget: {
                        select: { id: true, status: true, currentVersion: true },
                    },
                },
            });
        });

        revalidatePath("/dashboard/budgets");
        revalidatePath(`/dashboard/budgets/budget/${existingBudget.slug}`); // Clear old cache
        revalidatePath(`/dashboard/budgets/budget/${newSlug}`);
        revalidatePath("/dashboard/official-budgets");
        if (updatedBudget.officialBudget) {
            revalidatePath(`/dashboard/official-budgets/${updatedBudget.officialBudget.id}`);
        }

        return { success: "Actualizado correctamente", slug: updatedBudget.slug, budget: updatedBudget };
    } catch (error) {
        console.error("Error updating budget:", error);
        return { error: "Error al actualizar el presupuesto" };
    }
};
