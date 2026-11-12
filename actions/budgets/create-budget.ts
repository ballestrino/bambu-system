"use server";

import { getBudgetAdminSession } from "@/lib/budget-admin";
import { db } from "@/lib/db";
import { BudgetSchema, BudgetFormValues } from "@/schemas/BudgetSchema";
import { buildBudgetOptionRows } from "@/lib/budget-option-rows";
import { slugifyBudgetName } from "@/lib/budget-slug";

export const createBudget = async (values: BudgetFormValues) => {
    const admin = await getBudgetAdminSession();

    if ("error" in admin) {
        return { error: admin.error };
    }

    const validatedFields = BudgetSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Campos inválidos" };
    }

    const { name, description, categoryIds } = validatedFields.data;
    const optionRows = buildBudgetOptionRows(validatedFields.data);

    try {
        // Generate Slug
        const slug = slugifyBudgetName(name);

        // Check uniqueness
        const existingBudget = await db.budget.findUnique({ where: { slug }, select: { id: true } });

        if (existingBudget) {
            return { error: "Este título ya está en uso. Por favor elige otro nombre para tu presupuesto." };
        }

        const budget = await db.budget.create({
            data: {
                name,
                description,
                slug,
                userId: admin.session.user.id,
                budgetCategory: categoryIds && categoryIds.length > 0 ? {
                    connect: categoryIds.map((id) => ({ id }))
                } : undefined,
                budgetOptions: { create: optionRows },
            }
        });

        return { success: "exito", budget: budget };
    } catch (error) {
        console.error("Error creating budget:", error);
        return { error: "Error al crear el presupuesto" };
    }
};

