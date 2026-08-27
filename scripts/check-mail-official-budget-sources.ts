import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  classifyOfficialBudgetSearch,
  type OfficialBudgetSearchCandidate,
} from "../lib/official-budgets/search-classification";
import {
  getGroundedPriceMismatch,
  hasUngroundedQuotedPrice,
} from "../lib/mail-agent/price-grounding";

const baseCriteria = {
  service: "hogar",
  frequency: "week" as const,
  visits: 1,
  hoursPerVisit: 4,
  employees: 1,
  hasProducts: null,
};

const option = (
  officialBudgetId: string,
  hasProducts: boolean,
  overrides: Partial<OfficialBudgetSearchCandidate> = {}
): OfficialBudgetSearchCandidate => ({
  officialBudgetId,
  serviceName: "Limpieza de hogar",
  serviceCategories: ["Hogar"],
  visitType: "week",
  visits: 1,
  hoursPerVisit: 4,
  employees: 1,
  hasProducts,
  ...overrides,
});

const variants = [option("official-1", false), option("official-1", true)];
const exact = classifyOfficialBudgetSearch(baseCriteria, variants);
assert.equal(exact.status, "exact");
assert.equal(exact.matches.length, 2, "unspecified products returns both options");

assert.equal(
  classifyOfficialBudgetSearch(
    { ...baseCriteria, hasProducts: true },
    variants
  ).matches.length,
  1
);
assert.equal(
  classifyOfficialBudgetSearch(
    { ...baseCriteria, hoursPerVisit: 3 },
    variants
  ).status,
  "partial"
);
assert.equal(
  classifyOfficialBudgetSearch(baseCriteria, [
    option("official-1", true),
    option("official-2", true),
  ]).status,
  "ambiguous"
);
assert.equal(
  classifyOfficialBudgetSearch(
    { ...baseCriteria, employees: null },
    variants
  ).status,
  "incomplete"
);
assert.equal(
  classifyOfficialBudgetSearch(baseCriteria, [
    option("official-1", true, { serviceName: "Oficinas", serviceCategories: [] }),
  ]).status,
  "no_result"
);

assert.equal(
  getGroundedPriceMismatch("El precio final es $ 7.320,00.", [7320]).mismatch,
  false
);
assert.equal(
  getGroundedPriceMismatch("El precio final es $ 7.500.", [7320]).mismatch,
  true
);
assert.equal(
  getGroundedPriceMismatch("El precio final es 7.500 pesos.", [7320]).mismatch,
  true
);
assert(!hasUngroundedQuotedPrice("Sin importes", 1));
assert(hasUngroundedQuotedPrice("Total UYU 7320", 0));
assert(!hasUngroundedQuotedPrice("Total UYU 7320", 1));
assert(!hasUngroundedQuotedPrice("Coordinamos la visita", 0));

const migration = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260825120000_mail_official_budget_sources/migration.sql"
  ),
  "utf8"
);
assert(migration.includes('REFERENCES "OfficialBudgetVersion"("id") ON DELETE RESTRICT'));
assert(migration.includes('REFERENCES "OfficialBudgetVersionOption"("id") ON DELETE RESTRICT'));
assert(migration.includes('CREATE TRIGGER "MailDraftRevision_immutable"'));
assert(migration.includes('CREATE TRIGGER "MailDraftSource_guard"'));

console.log("Mail official-budget source checks passed");
