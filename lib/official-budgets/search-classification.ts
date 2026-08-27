import type { OfficialBudgetSearchCriteria } from "@/schemas/official-budget-search";

export type OfficialBudgetSearchCandidate = {
  officialBudgetId: string;
  serviceName: string;
  serviceCategories: string[];
  visitType: "days" | "week" | "month";
  visits: number;
  hoursPerVisit: number;
  employees: number;
  hasProducts: boolean;
};

export type OfficialBudgetSearchStatus =
  | "exact"
  | "partial"
  | "ambiguous"
  | "incomplete"
  | "no_result";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const missingFields = (criteria: OfficialBudgetSearchCriteria) =>
  (["service", "frequency", "visits", "hoursPerVisit", "employees"] as const)
    .filter((field) => criteria[field] === null);

const serviceMatches = (
  candidate: OfficialBudgetSearchCandidate,
  service: string
) => {
  const needle = normalize(service);
  const haystack = normalize(
    [candidate.serviceName, ...candidate.serviceCategories].join(" ")
  );
  return needle.split(/\s+/).every((token) => haystack.includes(token));
};

const sameNumber = (left: number, right: number) =>
  Math.abs(left - right) < 0.0001;

const optionMatches = (
  candidate: OfficialBudgetSearchCandidate,
  criteria: OfficialBudgetSearchCriteria
) =>
  candidate.visitType === criteria.frequency &&
  candidate.visits === criteria.visits &&
  sameNumber(candidate.hoursPerVisit, criteria.hoursPerVisit ?? -1) &&
  candidate.employees === criteria.employees &&
  (criteria.hasProducts === null || candidate.hasProducts === criteria.hasProducts);

export const classifyOfficialBudgetSearch = (
  criteria: OfficialBudgetSearchCriteria,
  candidates: OfficialBudgetSearchCandidate[]
) => {
  const missing = missingFields(criteria);
  if (missing.length) {
    return { status: "incomplete" as const, missingFields: missing, matches: [] };
  }

  const serviceCandidates = candidates.filter((candidate) =>
    serviceMatches(candidate, criteria.service ?? "")
  );
  const exact = serviceCandidates.filter((candidate) =>
    optionMatches(candidate, criteria)
  );
  const budgets = new Set(exact.map(({ officialBudgetId }) => officialBudgetId));
  if (budgets.size > 1) {
    return { status: "ambiguous" as const, missingFields: [], matches: exact };
  }
  if (exact.length) {
    return { status: "exact" as const, missingFields: [], matches: exact };
  }
  if (serviceCandidates.length) {
    return {
      status: "partial" as const,
      missingFields: [],
      matches: serviceCandidates,
    };
  }
  return { status: "no_result" as const, missingFields: [], matches: [] };
};
