import { Prisma } from "@prisma/client";

import type { OfficialBudgetSnapshot } from "@/lib/official-budgets/snapshot";

type SnapshotOption = OfficialBudgetSnapshot["options"][number];

const decimal = (value: number) => new Prisma.Decimal(String(value));

const buildOptionData = (
  option: SnapshotOption
): Prisma.OfficialBudgetVersionOptionCreateWithoutVersionInput => ({
  position: option.position,
  hasProducts: option.hasProducts,
  visits: option.visits,
  visitType: option.visitType,
  hoursPerVisit: decimal(option.hoursPerVisit),
  employees: option.employees,
  effectiveMonthlyVisits: decimal(option.effectiveMonthlyVisits),
  monthlyWorkload: decimal(option.monthlyWorkload),
  monthlyWorkloadIsEstimate: option.monthlyWorkloadIsEstimate,
  weeklyMultiplier: decimal(option.weeklyMultiplier),
  nominalHour: decimal(option.nominalHour),
  nominalSalary: decimal(option.nominalSalary),
  incidenceContributionPercent: decimal(
    option.incidenceContributionPercent
  ),
  companyContributionPercent: decimal(option.companyContributionPercent),
  personalContributionPercent: decimal(option.personalContributionPercent),
  transportationCost: decimal(option.transportationCost),
  productsCost: decimal(option.productsCost),
  productsIvaPercent: decimal(option.productsIvaPercent),
  productsRevenuePercent: decimal(option.productsRevenuePercent),
  serviceRevenuePercent: decimal(option.serviceRevenuePercent),
  ivaPercent: decimal(option.ivaPercent),
  netPrice: decimal(option.netPrice),
  ivaAmount: decimal(option.ivaAmount),
  finalPrice: decimal(option.finalPrice),
  hourlyPrice: decimal(option.hourlyPrice),
  finalPriceIsAuthoritative: option.finalPriceIsAuthoritative,
  calculatedPriceIsEstimate: option.calculatedPriceIsEstimate,
  calculatedEffectiveNominalHour: decimal(
    option.calculatedEffectiveNominalHour
  ),
  calculatedLaborCost: decimal(option.calculatedLaborCost),
  calculatedPersonalContribution: decimal(
    option.calculatedPersonalContribution
  ),
  calculatedIncidenceContribution: decimal(
    option.calculatedIncidenceContribution
  ),
  calculatedCompanyContribution: decimal(
    option.calculatedCompanyContribution
  ),
  calculatedContributionsTotal: decimal(
    option.calculatedContributionsTotal
  ),
  calculatedServiceCostBasis: decimal(option.calculatedServiceCostBasis),
  calculatedServiceRevenue: decimal(option.calculatedServiceRevenue),
  calculatedProductsRevenue: decimal(option.calculatedProductsRevenue),
  calculatedProductsNetPrice: decimal(option.calculatedProductsNetPrice),
  calculatedNetPrice: decimal(option.calculatedNetPrice),
  calculatedIvaAmount: decimal(option.calculatedIvaAmount),
  calculatedFinalPrice: decimal(option.calculatedFinalPrice),
  calculationMetadata: option.calculationMetadata,
});

export const buildOfficialVersionData = (
  snapshot: OfficialBudgetSnapshot,
  version: number,
  publishedById: string
): Prisma.OfficialBudgetVersionCreateWithoutOfficialBudgetInput => ({
  version,
  serviceName: snapshot.serviceName,
  serviceDescription: snapshot.serviceDescription,
  serviceCategories: snapshot.serviceCategories,
  currency: snapshot.currency,
  sourceBudgetUpdatedAt: snapshot.sourceBudgetUpdatedAt,
  publishedBy: { connect: { id: publishedById } },
  options: { create: snapshot.options.map(buildOptionData) },
});
