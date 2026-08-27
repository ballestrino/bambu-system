import "server-only";

import { db } from "@/lib/db";
import {
  classifyOfficialBudgetSearch,
  type OfficialBudgetSearchCandidate,
} from "@/lib/official-budgets/search-classification";
import {
  officialBudgetSearchCriteriaSchema,
  type OfficialBudgetSearchCriteria,
} from "@/schemas/official-budget-search";

const categoryNames = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((category) =>
        category && typeof category === "object" && "name" in category
          ? [String(category.name)]
          : []
      )
    : [];

const getActiveCandidates = async () => {
  const budgets = await db.officialBudget.findMany({
    where: { status: "ACTIVE" },
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: { options: { orderBy: { position: "asc" } } },
      },
    },
  });
  return budgets.flatMap((budget) => {
    const version = budget.versions[0];
    if (!version || version.version !== budget.currentVersion) return [];
    const categories = categoryNames(version.serviceCategories);
    return version.options.map((option) => ({ budget, version, option, categories }));
  });
};

const classifyCandidate = (
  item: Awaited<ReturnType<typeof getActiveCandidates>>[number]
): OfficialBudgetSearchCandidate => ({
  officialBudgetId: item.budget.id,
  serviceName: item.version.serviceName,
  serviceCategories: item.categories,
  visitType: item.option.visitType,
  visits: item.option.visits,
  hoursPerVisit: Number(item.option.hoursPerVisit),
  employees: item.option.employees,
  hasProducts: item.option.hasProducts,
});

const serializeMatch = (
  item: Awaited<ReturnType<typeof getActiveCandidates>>[number]
) => ({
  sourceOptionId: item.option.id,
  officialBudget: {
    id: item.budget.id,
    name: item.budget.sourceBudgetName,
    slug: item.budget.sourceBudgetSlug,
    generatorId: item.budget.sourceBudgetId,
  },
  immutableVersion: {
    id: item.version.id,
    number: item.version.version,
    publishedAt: item.version.publishedAt.toISOString(),
  },
  service: {
    name: item.version.serviceName,
    description: item.version.serviceDescription,
    categories: item.categories,
  },
  conditions: {
    frequency: item.option.visitType,
    visits: item.option.visits,
    hoursPerVisit: Number(item.option.hoursPerVisit),
    employees: item.option.employees,
    hasProducts: item.option.hasProducts,
  },
  prices: {
    currency: item.version.currency,
    net: Number(item.option.netPrice),
    ivaPercent: Number(item.option.ivaPercent),
    ivaAmount: Number(item.option.ivaAmount),
    final: Number(item.option.finalPrice),
    hourlyNet: Number(item.option.hourlyPrice),
  },
  workload: {
    effectiveMonthlyVisits: Number(item.option.effectiveMonthlyVisits),
    monthlyHours: Number(item.option.monthlyWorkload),
    isEstimate: item.option.monthlyWorkloadIsEstimate,
    weeklyMultiplier: Number(item.option.weeklyMultiplier),
  },
  calculation: item.option.calculationMetadata,
});

export const searchOfficialBudgets = async (input: unknown) => {
  const criteria = officialBudgetSearchCriteriaSchema.parse(input);
  const items = await getActiveCandidates();
  const classification = classifyOfficialBudgetSearch(
    criteria,
    items.map(classifyCandidate)
  );
  const matchKeys = new Set(
    classification.matches.map((match) =>
      [
        match.officialBudgetId,
        match.visitType,
        match.visits,
        match.hoursPerVisit,
        match.employees,
        match.hasProducts,
      ].join(":"))
  );
  const matches = items.filter((item) =>
    matchKeys.has(
      [
        item.budget.id,
        item.option.visitType,
        item.option.visits,
        Number(item.option.hoursPerVisit),
        item.option.employees,
        item.option.hasProducts,
      ].join(":")
    )
  );
  return {
    status: classification.status,
    criteria,
    missingFields: classification.missingFields,
    canQuotePrice: classification.status === "exact",
    matches: matches.map(serializeMatch),
  };
};

export const SEARCH_OFFICIAL_BUDGETS_TOOL = {
  type: "function",
  name: "searchOfficialBudgets",
  description:
    "Busca precios exclusivamente en versiones vigentes de presupuestos oficiales de Bambú.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: [
      "service",
      "frequency",
      "visits",
      "hoursPerVisit",
      "employees",
      "hasProducts",
    ],
    properties: {
      service: { type: ["string", "null"] },
      frequency: { type: ["string", "null"], enum: ["days", "week", "month", null] },
      visits: { type: ["integer", "null"], minimum: 1 },
      hoursPerVisit: { type: ["number", "null"], exclusiveMinimum: 0 },
      employees: { type: ["integer", "null"], minimum: 1 },
      hasProducts: { type: ["boolean", "null"] },
    },
  },
} as const;

export type OfficialBudgetSearchResult = Awaited<
  ReturnType<typeof searchOfficialBudgets>
>;
export type { OfficialBudgetSearchCriteria };
