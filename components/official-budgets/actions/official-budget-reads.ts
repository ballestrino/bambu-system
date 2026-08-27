"use server";

import { getOfficialBudgetById, getOfficialBudgets } from "@/data/official-budgets";
import type {
  OfficialBudgetDetailDto,
  OfficialBudgetListItemDto,
  OfficialBudgetOptionDto,
} from "@/components/official-budgets/types";

const numberFields = [
  "hoursPerVisit", "effectiveMonthlyVisits", "monthlyWorkload", "weeklyMultiplier", "nominalHour",
  "nominalSalary", "incidenceContributionPercent", "companyContributionPercent",
  "personalContributionPercent", "transportationCost", "productsCost",
  "productsIvaPercent", "productsRevenuePercent", "serviceRevenuePercent",
  "ivaPercent", "netPrice", "ivaAmount", "finalPrice", "hourlyPrice",
  "calculatedLaborCost", "calculatedPersonalContribution",
  "calculatedIncidenceContribution", "calculatedCompanyContribution",
  "calculatedContributionsTotal",
  "calculatedServiceCostBasis", "calculatedServiceRevenue",
  "calculatedProductsRevenue", "calculatedProductsNetPrice", "calculatedNetPrice",
  "calculatedIvaAmount", "calculatedFinalPrice",
] as const;

const serializeOption = (option: Record<string, unknown>) => {
  const serialized = { ...option } as Record<string, unknown>;
  numberFields.forEach((field) => {
    serialized[field] = Number(option[field]);
  });
  delete serialized.versionId;
  delete serialized.calculationMetadata;
  return serialized as OfficialBudgetOptionDto;
};

export const getOfficialBudgetsAction = async (filters: {
  status?: "ACTIVE" | "ARCHIVED";
  query?: string;
}): Promise<OfficialBudgetListItemDto[]> => {
  const rows = await getOfficialBudgets(filters);
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    sourceBudgetName: row.sourceBudgetName,
    sourceBudgetSlug: row.sourceBudgetSlug,
    currentVersion: row.currentVersion,
    publishedAt: row.publishedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    sourceBudget: row.sourceBudget,
  }));
};

export const getOfficialBudgetAction = async (
  officialBudgetId: string
): Promise<OfficialBudgetDetailDto | null> => {
  const row = await getOfficialBudgetById(officialBudgetId);
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    sourceBudgetName: row.sourceBudgetName,
    sourceBudgetSlug: row.sourceBudgetSlug,
    currentVersion: row.currentVersion,
    publishedAt: row.publishedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    sourceBudget: row.sourceBudget,
    versions: row.versions.map((version) => ({
      id: version.id,
      version: version.version,
      serviceName: version.serviceName,
      serviceDescription: version.serviceDescription,
      currency: version.currency,
      publishedAt: version.publishedAt.toISOString(),
      sourceBudgetUpdatedAt: version.sourceBudgetUpdatedAt.toISOString(),
      publishedBy: version.publishedBy,
      options: version.options.map((option) =>
        serializeOption(option as unknown as Record<string, unknown>)
      ),
    })),
  };
};
