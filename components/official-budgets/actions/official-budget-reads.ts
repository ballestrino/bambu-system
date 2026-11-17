"use server";

import { getOfficialBudgetById, getOfficialBudgetList, getOfficialBudgets } from "@/data/official-budgets";
import type {
  OfficialBudgetDetailDto,
  OfficialBudgetListDto,
  OfficialBudgetListItemDto,
  OfficialBudgetOptionDto,
} from "@/components/official-budgets/types";

const readCategories = (value: unknown) =>
  (Array.isArray(value) ? value : []).flatMap((item) => {
    const name = (item as { name?: unknown } | null)?.name;
    return typeof name === "string" && name.trim() ? [{ name }] : [];
  });

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
  // Cualquier Decimal pasa a número: uno que no esté en la lista (como
  // calculatedEffectiveNominalHour) no puede cruzar al cliente.
  const serialized = Object.fromEntries(
    Object.entries(option).map(([key, value]) => [
      key,
      value && typeof value === "object" && "toNumber" in value ? Number(value) : value,
    ])
  ) as Record<string, unknown>;
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

// La pantalla de la lista: precios de la versión vigente y conteo por pestaña.
export const getOfficialBudgetListAction = async (filters: {
  status?: "ACTIVE" | "ARCHIVED";
  query?: string;
}): Promise<OfficialBudgetListDto> => {
  const { rows, counts } = await getOfficialBudgetList(filters);
  const countOf = (status: "ACTIVE" | "ARCHIVED") =>
    counts.find((item) => item.status === status)?._count._all ?? 0;

  return {
    counts: { ACTIVE: countOf("ACTIVE"), ARCHIVED: countOf("ARCHIVED") },
    rows: rows.map((row) => {
      const version = row.versions[0];
      return {
        id: row.id,
        status: row.status,
        sourceBudgetName: row.sourceBudgetName,
        sourceBudgetSlug: row.sourceBudgetSlug,
        currentVersion: row.currentVersion,
        publishedAt: row.publishedAt.toISOString(),
        archivedAt: row.archivedAt?.toISOString() ?? null,
        sourceBudget: row.sourceBudget,
        versionPublishedAt: (version?.publishedAt ?? row.publishedAt).toISOString(),
        options: (version?.options ?? []).map((option) => ({
          hasProducts: option.hasProducts,
          visits: option.visits,
          visitType: option.visitType,
          hoursPerVisit: Number(option.hoursPerVisit),
          employees: option.employees,
          productsCost: Number(option.productsCost),
          netPrice: Number(option.netPrice),
          ivaAmount: Number(option.ivaAmount),
          finalPrice: Number(option.finalPrice),
          hourlyPrice: Number(option.hourlyPrice),
        })),
      };
    }),
  };
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
      serviceCategories: readCategories(version.serviceCategories),
      options: version.options.map((option) =>
        serializeOption(option as unknown as Record<string, unknown>)
      ),
    })),
  };
};
