import { BudgetFormValues } from "@/components/budgets/schema";

export const PRODUCT_MARGIN_PCT = 15;

export const calculateEffectiveVisits = (visits: number, type: string) => {
    if (type === "week") {
        return visits * 4.32;
    }
    return visits;
};

export const calculateEstimates = (values: Partial<BudgetFormValues>) => {
    const visits = Number(values.visits) || 0;
    const hours = Number(values.hours_per_visit) || 0;
    const employees = Number(values.employees) || 1;
    const visitType = values.visit_type || "days";

    const effectiveVisits = calculateEffectiveVisits(visits, visitType);
    
    // Estimate Transport: Visits/month * Employees * 52 (Bus Ticket Price?)
    const transportCost = effectiveVisits * employees * 52;
    
    // Estimate Products: (TotalHours / 4) * 175
    const totalHours = effectiveVisits * hours * employees;
    const productPrice = (totalHours / 4) * 175;

    return {
        transportation_cost: Number(transportCost.toFixed(2)),
        products_price: Number(productPrice.toFixed(2))
    };
};

export const calculateBudgetTotals = (values: Partial<BudgetFormValues>) => {
    // 1. Safe Defaults
    const visits = Number(values.visits) || 0;
    const visitType = values.visit_type || "days";
    const hours = Number(values.hours_per_visit) || 0;
    const rate = Number(values.nominal_hour) || 0;
    const employees = Number(values.employees) || 1;
    const transport = Number(values.transportation_cost) || 0;
    const products = Number(values.products_price) || 0;
    const revenuePct = Number(values.revenue_percent) || 0;
    const ivaPct = Number(values.iva) || 22; // Default to 22 if not set

    // 2. Base Calculations
    const effectiveVisits = calculateEffectiveVisits(visits, visitType);
    
    const totalHours = effectiveVisits * hours * employees;
    const laborCost = totalHours * rate;

    // 3. Contributions
    const personalPct = (Number(values.personal_contribution) || 0) / 100;
    const personalVal = laborCost * personalPct;

    const incidencePct = values.incidence_enabled ? (Number(values.incidence_contribution) || 0) / 100 : 0;
    const companyPct = values.company_enabled ? (Number(values.company_contribution) || 0) / 100 : 0;

    const incidenceVal = laborCost * incidencePct;
    const companyVal = laborCost * companyPct;

    const totalContribsExtra = incidenceVal + companyVal;

    // 4. Service Cost Basis
    const costBasisNoProducts = laborCost + totalContribsExtra + transport;

    // 5. Service Revenue & Price
    const revenueAmountService = costBasisNoProducts * (revenuePct / 100);
    const priceNoTaxService = costBasisNoProducts + revenueAmountService;
    const ivaAmountService = priceNoTaxService * (ivaPct / 100);
    const finalPriceService = priceNoTaxService + ivaAmountService;

    // 6. Product Calculations
    const revenueAmountProducts = products * (PRODUCT_MARGIN_PCT / 100);
    const priceNoTaxProducts = products + revenueAmountProducts;
    
    // 7. Totals (Service + Products)
    const totalPreTaxWithProducts = priceNoTaxService + priceNoTaxProducts;
    const totalIvaWithProducts = totalPreTaxWithProducts * (ivaPct / 100);
    const totalFinalWithProducts = totalPreTaxWithProducts + totalIvaWithProducts;

    return {
        totalHours,
        laborCost,
        transport,
        products,
        personalVal,
        incidenceVal,
        companyVal,
        totalContribsExtra,
        costBasisNoProducts,
        revenueAmountService,
        priceNoTaxService,
        ivaAmountService,
        finalPriceService,
        revenueAmountProducts,
        priceNoTaxProducts,
        totalPreTaxWithProducts,
        totalIvaWithProducts,
        totalFinalWithProducts
    };
};
