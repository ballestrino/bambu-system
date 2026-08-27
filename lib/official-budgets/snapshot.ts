import {
  calculateBudgetTotals,
  calculateEffectiveVisits,
} from "@/lib/budget-calculations";

type GeneratorOption = {
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
  has_products: boolean;
};

type GeneratorBudget = {
  name: string;
  description: string | null;
  updatedAt: Date;
  budgetCategory: Array<{
    name: string;
    description: string | null;
    color: string | null;
  }>;
  budgetOptions: GeneratorOption[];
};

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const money = (value: number) => round(value, 2);
const precise = (value: number) => round(value, 4);

const snapshotOption = (option: GeneratorOption, position: number) => {
  const calculation = calculateBudgetTotals({
    ...option,
    incidence_enabled: option.incidence_contribution > 0,
    company_enabled: option.company_contribution > 0,
    personal_enabled: option.personal_contribution > 0,
  });
  const effectiveMonthlyVisits = calculateEffectiveVisits(
    option.visits,
    option.visit_type
  );
  const monthlyWorkload =
    effectiveMonthlyVisits * option.hours_per_visit * option.employees;
  const taxFactor = 1 + option.iva / 100;
  const netPrice = taxFactor > 0 ? option.price / taxFactor : option.price;
  const effectiveNominalHour =
    option.personal_contribution > 0
      ? option.nominal_hour
      : option.nominal_hour * (1 - 0.181);

  return {
    position,
    hasProducts: option.has_products,
    visits: option.visits,
    visitType: option.visit_type,
    hoursPerVisit: precise(option.hours_per_visit),
    employees: option.employees,
    effectiveMonthlyVisits: precise(effectiveMonthlyVisits),
    monthlyWorkload: precise(monthlyWorkload),
    monthlyWorkloadIsEstimate: true,
    weeklyMultiplier: 4.32,
    nominalHour: money(option.nominal_hour),
    nominalSalary: money(option.nominal_salary),
    incidenceContributionPercent: precise(option.incidence_contribution),
    companyContributionPercent: precise(option.company_contribution),
    personalContributionPercent: precise(option.personal_contribution),
    transportationCost: money(option.transportation_cost),
    productsCost: money(option.products_price),
    productsIvaPercent: precise(option.products_iva),
    productsRevenuePercent: precise(option.products_revenue_percent),
    serviceRevenuePercent: precise(option.revenue_percent),
    ivaPercent: precise(option.iva),
    netPrice: money(netPrice),
    ivaAmount: money(option.price - netPrice),
    finalPrice: money(option.price),
    hourlyPrice: money(monthlyWorkload > 0 ? netPrice / monthlyWorkload : 0),
    finalPriceIsAuthoritative: true,
    calculatedPriceIsEstimate: true,
    calculatedEffectiveNominalHour: precise(effectiveNominalHour),
    calculatedLaborCost: money(calculation.laborCost),
    calculatedPersonalContribution: money(calculation.personalVal),
    calculatedIncidenceContribution: money(calculation.incidenceVal),
    calculatedCompanyContribution: money(calculation.companyVal),
    calculatedContributionsTotal: money(calculation.totalContribsExtra),
    calculatedServiceCostBasis: money(calculation.costBasisNoProducts),
    calculatedServiceRevenue: money(calculation.revenueAmountService),
    calculatedProductsRevenue: money(calculation.revenueAmountProducts),
    calculatedProductsNetPrice: money(calculation.priceNoTaxProducts),
    calculatedNetPrice: money(
      option.has_products
        ? calculation.totalPreTaxWithProducts
        : calculation.priceNoTaxService
    ),
    calculatedIvaAmount: money(
      option.has_products
        ? calculation.totalIvaWithProducts
        : calculation.ivaAmountService
    ),
    calculatedFinalPrice: money(
      option.has_products
        ? calculation.totalFinalWithProducts
        : calculation.finalPriceService
    ),
    calculationMetadata: {
      calculatorVersion: "budget-calculations-v1",
      fixedPriceSource: "BudgetOption.price",
      hourlyPriceBasis: "AUTHORITATIVE_NET_PRICE",
      monthlyWorkloadFormula:
        option.visit_type === "week"
          ? "visits * hoursPerVisit * employees * 4.32"
          : "visits * hoursPerVisit * employees",
      monthlyWorkloadKind: "ESTIMATE",
      calculatedPriceKind: "ESTIMATE",
      fixedPriceKind: "AUTHORITATIVE",
    },
  };
};

export const createOfficialBudgetSnapshot = (budget: GeneratorBudget) => ({
  serviceName: budget.name,
  serviceDescription: budget.description,
  serviceCategories: budget.budgetCategory.map((category) => ({
    name: category.name,
    description: category.description,
    color: category.color,
  })),
  currency: "UYU",
  sourceBudgetUpdatedAt: budget.updatedAt,
  options: budget.budgetOptions.map(snapshotOption),
});

export type OfficialBudgetSnapshot = ReturnType<
  typeof createOfficialBudgetSnapshot
>;
