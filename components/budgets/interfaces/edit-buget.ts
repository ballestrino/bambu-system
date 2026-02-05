export interface BudgetOption {
    has_products: boolean;
    visits: number;
    visit_type: "days" | "week" | "month";
    hours_per_visit: number;
    nominal_hour: number;
    nominal_salary: number;
    employees: number;
    incidence_contribution: number;
    company_contribution: number;
    personal_contribution: number;
    transportation_cost: number;
    products_price: number;
    products_iva: number;
    products_revenue_percent: number;
    revenue_percent: number;
    price: number;
    iva: number;
}

export interface ExistingBudget {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    budgetOptions: BudgetOption[];
    budgetCategory: { id: string; name: string }[];
}