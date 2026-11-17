export type OfficialBudgetStatus = "ACTIVE" | "ARCHIVED";

export type OfficialBudgetOptionDto = {
  id: string;
  position: number;
  hasProducts: boolean;
  visits: number;
  visitType: "days" | "week" | "month";
  hoursPerVisit: number;
  employees: number;
  effectiveMonthlyVisits: number;
  monthlyWorkload: number;
  weeklyMultiplier: number;
  nominalHour: number;
  nominalSalary: number;
  incidenceContributionPercent: number;
  companyContributionPercent: number;
  personalContributionPercent: number;
  transportationCost: number;
  productsCost: number;
  productsIvaPercent: number;
  productsRevenuePercent: number;
  serviceRevenuePercent: number;
  ivaPercent: number;
  netPrice: number;
  ivaAmount: number;
  finalPrice: number;
  hourlyPrice: number;
  calculatedLaborCost: number;
  calculatedPersonalContribution: number;
  calculatedIncidenceContribution: number;
  calculatedCompanyContribution: number;
  calculatedContributionsTotal: number;
  calculatedServiceCostBasis: number;
  calculatedServiceRevenue: number;
  calculatedProductsRevenue: number;
  calculatedProductsNetPrice: number;
  calculatedNetPrice: number;
  calculatedIvaAmount: number;
  calculatedFinalPrice: number;
};

export type OfficialBudgetVersionDto = {
  id: string;
  version: number;
  serviceName: string;
  serviceDescription: string | null;
  currency: string;
  publishedAt: string;
  sourceBudgetUpdatedAt: string;
  publishedBy: { name: string | null; email: string | null };
  serviceCategories: { name: string }[];
  options: OfficialBudgetOptionDto[];
};

export type OfficialBudgetListItemDto = {
  id: string;
  status: OfficialBudgetStatus;
  sourceBudgetName: string;
  sourceBudgetSlug: string;
  currentVersion: number;
  publishedAt: string;
  archivedAt: string | null;
  sourceBudget: { name: string; slug: string } | null;
};

export type OfficialBudgetRowOptionDto = {
  hasProducts: boolean;
  visits: number;
  visitType: "days" | "week" | "month";
  hoursPerVisit: number;
  employees: number;
  productsCost: number;
  netPrice: number;
  ivaAmount: number;
  finalPrice: number;
  hourlyPrice: number;
};

// Una fila de la lista: el oficial con su versión vigente.
export type OfficialBudgetRowDto = OfficialBudgetListItemDto & {
  versionPublishedAt: string;
  options: OfficialBudgetRowOptionDto[];
};

export type OfficialBudgetListDto = {
  rows: OfficialBudgetRowDto[];
  counts: Record<OfficialBudgetStatus, number>;
};

export type OfficialBudgetDetailDto = OfficialBudgetListItemDto & {
  versions: OfficialBudgetVersionDto[];
};
