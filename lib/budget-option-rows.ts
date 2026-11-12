import { calculateBudgetTotals } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Las opciones que guardan crear y editar: con productos (solo si hay) y sin
// productos (siempre). Un aporte apagado se guarda en 0; el BSE va tal cual
// (null es un presupuesto sin BSE calculado).
export const buildBudgetOptionRows = (values: BudgetFormValues) => {
    const { priceNoTaxService, revenueAmountService, revenueAmountProducts } = calculateBudgetTotals(values);
    const shared = {
        visits: values.visits,
        visit_type: values.visit_type,
        hours_per_visit: values.hours_per_visit,
        nominal_hour: values.nominal_hour,
        nominal_salary: values.nominal_salary,
        employees: values.employees,
        incidence_contribution: values.incidence_enabled ? values.incidence_contribution : 0,
        company_contribution: values.company_enabled ? values.company_contribution : 0,
        personal_contribution: values.personal_enabled ? values.personal_contribution : 0,
        bse_contribution: values.bse_contribution,
        transportation_cost: values.transportation_cost,
        extras: values.extras,
        revenue_percent: values.revenue_percent,
        iva: values.iva,
    };

    return [
        ...(values.products_price > 0
            ? [{
                ...shared,
                has_products: true,
                products_price: values.products_price,
                products_iva: values.products_iva,
                products_revenue_percent: values.products_revenue_percent,
                price: values.price,
                profit: revenueAmountService + revenueAmountProducts,
            }]
            : []),
        {
            ...shared,
            has_products: false,
            products_price: 0,
            products_iva: 0,
            products_revenue_percent: 0,
            price: priceNoTaxService + (priceNoTaxService * (values.iva / 100)),
            profit: revenueAmountService,
        },
    ];
};
