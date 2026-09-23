"use server";

import { getBudgetAdminSession } from "@/lib/budget-admin";
import { db } from "@/lib/db";
import { BudgetIdSchema, BudgetSchema, BudgetSlugSchema, BudgetFormValues } from "@/schemas/BudgetSchema";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { revalidatePath } from "next/cache";
import { BudgetChangedError } from "@/lib/budget-errors";
import { appendLinkedOfficialBudgetVersion } from "@/lib/official-budgets/versioning";

// expectedUpdatedAt (ISO) guarda solo si el presupuesto no cambió desde esa
// lectura. Lo usan las propuestas del agente; el formulario no lo manda.
export const updateBudget = async (
    id: string,
    newSlug: string,
    values: BudgetFormValues,
    options: { expectedUpdatedAt?: string } = {}
) => {
    const admin = await getBudgetAdminSession();

    if ("error" in admin) {
        return { error: admin.error };
    }
    const actorId = admin.session.user.id;

    const validatedFields = BudgetSchema.safeParse(values);
    const validatedId = BudgetIdSchema.safeParse(id);
    const validatedSlug = BudgetSlugSchema.safeParse(newSlug);

    if (!validatedFields.success || !validatedId.success) {
        return { error: "Campos inválidos" };
    }
    if (!validatedSlug.success) {
        return { error: validatedSlug.error.issues[0]?.message ?? "URL inválida" };
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
            select: { slug: true },
        });

        if (!existingBudget) {
            return { error: "Presupuesto no encontrado" };
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
            // 0. Compare-and-set: toma la fila y confirma que nadie la cambió.
            // Una escritura concurrente hace que el WHERE no coincida.
            if (options.expectedUpdatedAt) {
                const unchanged = await tx.budget.updateMany({
                    where: { id, updatedAt: new Date(options.expectedUpdatedAt) },
                    data: { updatedAt: new Date() },
                });
                if (unchanged.count !== 1) throw new BudgetChangedError();
            }

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
        if (error instanceof BudgetChangedError) return { error: error.message };
        console.error("Error updating budget:", error);
        return { error: "Error al actualizar el presupuesto" };
    }
};
