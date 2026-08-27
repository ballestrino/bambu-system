import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { Prisma } from "@prisma/client";

import { getLinkedBudgetDeletionError } from "../lib/official-budgets/deletion-guard";
import { createOfficialBudgetSnapshot } from "../lib/official-budgets/snapshot";
import {
  appendLinkedOfficialBudgetVersion,
  archiveOfficialBudgetInTransaction,
  publishOfficialBudgetInTransaction,
} from "../lib/official-budgets/versioning";

const option = (id: string, price: number) => ({
  id,
  createdAt: new Date("2026-08-14T12:00:00Z"),
  updatedAt: new Date("2026-08-14T12:00:00Z"),
  budgetId: "generator-1",
  visits: 1,
  visit_type: "week" as const,
  hours_per_visit: 4,
  nominal_hour: 250,
  nominal_salary: 0,
  employees: 2,
  incidence_contribution: 13.415,
  company_contribution: 12.625,
  personal_contribution: 18.1,
  transportation_cost: 500,
  products_price: 0,
  products_iva: 0,
  products_revenue_percent: 0,
  revenue_percent: 45,
  price,
  profit: 1_000,
  iva: 22,
  has_products: false,
});

const generator = {
  id: "generator-1",
  slug: "limpieza-semanal",
  name: "Limpieza semanal",
  description: "Servicio recurrente",
  userId: "actor-1",
  parentBudgetId: null,
  createdAt: new Date("2026-08-14T11:00:00Z"),
  updatedAt: new Date("2026-08-14T12:00:00Z"),
  budgetCategory: [
    { name: "Hogares", description: null, color: "#123456" },
  ],
  budgetOptions: [option("mutable-option-1", 12_200)],
};

const snapshot = createOfficialBudgetSnapshot(generator);
assert.equal(snapshot.options[0].monthlyWorkload, 34.56);
assert.equal(snapshot.options[0].monthlyWorkloadIsEstimate, true);
assert.equal(snapshot.options[0].finalPrice, 12_200);
assert.equal(snapshot.options[0].finalPriceIsAuthoritative, true);
assert.equal(snapshot.options[0].calculatedPriceIsEstimate, true);
assert(!("id" in snapshot.options[0]));
assert.equal(
  snapshot.options[0].calculationMetadata.monthlyWorkloadFormula,
  "visits * hoursPerVisit * employees * 4.32"
);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let official: Record<string, unknown> | null = null;
const versions: Array<Record<string, unknown>> = [];
const audits: Array<Record<string, unknown>> = [];
const fakeTx = {
  $queryRaw: async () => [{ id: generator.id }],
  budget: { findUnique: async () => generator },
  officialBudget: {
    findUnique: async (query: { where: Record<string, string> }) => {
      if (!official) return null;
      if (
        query.where.sourceBudgetId &&
        official.sourceBudgetId !== query.where.sourceBudgetId
      ) {
        return null;
      }
      return official;
    },
    findUniqueOrThrow: async () => {
      assert(official);
      return official;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const version = (data.versions as { create: Record<string, unknown> }).create;
      versions.push(clone(version));
      official = {
        id: "official-1",
        status: "ACTIVE",
        sourceBudgetId: generator.id,
        sourceBudgetSlug: generator.slug,
        currentVersion: 1,
        versions,
        ...data,
      };
      return official;
    },
    updateMany: async ({ data }: { data: Record<string, unknown> }) => {
      assert(official);
      if (data.currentVersion) {
        official.currentVersion = Number(official.currentVersion) + 1;
      }
      if (data.sourceBudgetId === null) {
        official.sourceBudgetId = null;
      }
      const patch = { ...data };
      delete patch.currentVersion;
      official = { ...official, ...patch };
      return { count: 1 };
    },
  },
  officialBudgetVersion: {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      versions.push(clone(data));
      return { id: `version-${versions.length}`, ...data };
    },
  },
  officialBudgetAuditEvent: {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      audits.push(data);
      return data;
    },
  },
} as unknown as Prisma.TransactionClient;

const run = async () => {
  await publishOfficialBudgetInTransaction(fakeTx, generator.id, "actor-1");
  assert.equal(versions.length, 1);
  assert.equal(versions[0].version, 1);
  const immutableFirstVersion = clone(versions[0]);

  generator.budgetOptions = [option("recreated-option-2", 13_420)];
  generator.updatedAt = new Date("2026-08-14T13:00:00Z");
  await appendLinkedOfficialBudgetVersion(fakeTx, generator.id, "actor-1");
  assert.equal(versions.length, 2);
  assert.equal(versions[1].version, 2);
  assert.deepEqual(versions[0], immutableFirstVersion);
  assert.equal(audits.at(-1)?.action, "VERSION_PUBLISHED");

  await archiveOfficialBudgetInTransaction(fakeTx, "official-1", "actor-1");
  assert.equal(official?.status, "ARCHIVED");
  assert.equal(official?.sourceBudgetId, null);
  assert.equal(versions.length, 2);
  assert(getLinkedBudgetDeletionError("official-1"));
  assert.equal(getLinkedBudgetDeletionError(null), null);

  const migration = readFileSync(
    path.join(
      process.cwd(),
      "prisma/migrations/20260814190000_official_budget_versioning/migration.sql"
    ),
    "utf8"
  );
  assert.match(migration, /sourceBudgetId_fkey[\s\S]*ON DELETE RESTRICT/);
  assert.match(migration, /OfficialBudgetVersion_immutable/);
  assert.match(migration, /OfficialBudgetVersionOption_immutable/);

  process.stdout.write("official budget checks passed\n");
};

void run();
