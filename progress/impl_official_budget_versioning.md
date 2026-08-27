# Implementation Report - official_budget_versioning

Status: done

## Implemented

- Added `OfficialBudget`, `OfficialBudgetVersion`,
  `OfficialBudgetVersionOption`, and `OfficialBudgetAuditEvent` with an active
  or archived lifecycle, actor metadata, ordered versions, and Decimal money.
- Added additive migration `20260814190000_official_budget_versioning`, an
  ON DELETE RESTRICT generator link, and database triggers that reject updates
  or deletes of version and option snapshots.
- Added pure snapshot construction for service metadata, categories, frequency,
  visits, hours, employees, products, contribution inputs, net price, IVA,
  fixed final price, hourly price, monthly workload, and calculation breakdown.
- Weekly workload uses `visits * hours * employees * 4.32`. Derived workload
  and calculated comparison prices are marked as estimates; the copied
  `BudgetOption.price` remains authoritative.
- Added administrator-only publish, archive, list, and detail operations with
  Zod validation, transaction-safe errors, audit events, and path invalidation.
- Generator edits append the next version inside the same transaction that
  recreates mutable BudgetOption rows. Snapshot persistence does not store or
  relate those mutable option IDs.
- Added generator row locking and conditional version/archive updates to keep
  publish, edit, and archive coherent under concurrency.
- Added administrator authorization and linked-official guards to generator
  deletion, backed by the database foreign key.

## Verification

- `pnpm check:official-budgets`: passed.
- `pnpm exec prisma validate`: passed.
- Read-only Prisma semantic diff against the configured database target matched
  the new enum, tables, Decimal columns, indexes, and restrictive foreign keys.
  Existing unmanaged mail indexes also appeared as unrelated drop suggestions
  and were not copied into the migration.
- `tsc --noEmit`: passed outside the restricted sandbox.
- `pnpm lint`: passed with zero warnings.
- `pnpm build`: passed outside the restricted sandbox, including Prisma Client
  generation, TypeScript, and all 26 application pages.
- Final `\.\init.ps1`: passed with zero active features, Prisma validation,
  repository lint, and harness validation green.

## Operational Boundary

- The migration file is local only. No database migration, deployment, commit,
  push, or production change was performed.
- Feature 21 owns the official-budget user interface and navigation.
