"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

const findUniqueSlug = async (base: string) => {
    let candidate = base;
    let attempt = 2;

    while (await db.budget.findUnique({ where: { slug: candidate }, select: { id: true } })) {
        candidate = `${base}-${attempt}`;
        attempt += 1;
    }

    return candidate;
};

export const duplicateBudget = async (budgetId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "No autorizado" };
    }

    try {
        const original = await db.budget.findUnique({
            where: { id: budgetId },
            include: {
                budgetOptions: true,
                budgetCategory: { select: { id: true } },
            },
        });

        if (!original) {
            return { error: "Presupuesto no encontrado" };
        }

        if (original.userId !== session.user.id) {
            return { error: "No autorizado" };
        }

        const newName = `${original.name} (copia)`;
        const baseSlug = slugify(newName);
        const slug = await findUniqueSlug(baseSlug);

        const budget = await db.budget.create({
            data: {
                name: newName,
                description: original.description,
                slug,
                userId: session.user.id,
                budgetCategory: original.budgetCategory.length > 0
                    ? { connect: original.budgetCategory.map(({ id }) => ({ id })) }
                    : undefined,
                budgetOptions: {
                    create: original.budgetOptions.map((option) => ({
                        has_products: option.has_products,
                        visits: option.visits,
                        visit_type: option.visit_type,
                        hours_per_visit: option.hours_per_visit,
                        nominal_hour: option.nominal_hour,
                        nominal_salary: option.nominal_salary,
                        employees: option.employees,
                        incidence_contribution: option.incidence_contribution,
                        company_contribution: option.company_contribution,
                        personal_contribution: option.personal_contribution,
                        transportation_cost: option.transportation_cost,
                        products_price: option.products_price,
                        products_iva: option.products_iva,
                        products_revenue_percent: option.products_revenue_percent,
                        revenue_percent: option.revenue_percent,
                        price: option.price,
                        profit: option.profit,
                        iva: option.iva,
                    })),
                },
            },
        });

        return { success: "exito", budget };
    } catch (error) {
        console.error("Error duplicating budget:", error);
        return { error: "error" };
    }
};
