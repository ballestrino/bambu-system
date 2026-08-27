# Implementation Report - official_budget_workspace_separation

Status: done

## Implemented

- Relabeled `/dashboard/budgets` as `Generador de presupuestos` while keeping
  its existing calculation, creation, editing, filtering, and category flows.
- Added `/dashboard/official-budgets` with active and archived views, search,
  source generator, current version, publication date, loading, empty, error,
  retry, and responsive states.
- Added `/dashboard/official-budgets/[id]` with immutable version selection,
  publisher metadata, full option inputs, calculated audit values, official
  net/IVA/final/hourly prices, and the 4.32 weekly-estimate explanation.
- Added guarded publish and archive controls backed by the Feature 20 admin
  actions. Archive requires explicit confirmation and preserves history while
  detaching the generator.
- Added generator list/detail official indicators and links. Linked generator
  deletion is disabled with an explanation; editing continues to create a new
  official version through the Feature 20 transaction.
- Added separate generator and official-budget entries to the dashboard
  sidebar, desktop menu, and mobile navigation.
- Added centralized official-budget query keys and invalidation for list,
  detail, generator badges, publication, generator edits, and archive state.

## Verification

- `pnpm check:official-budget-workspace`: passed.
- `pnpm check:official-budgets`: passed.
- `pnpm exec prisma validate`: passed.
- `pnpm lint`: passed with zero warnings.
- Direct `next build`: passed outside the restricted sandbox, including
  TypeScript and all 27 application pages.
- Full `pnpm build` reached Prisma generation but Windows could not replace a
  Prisma query-engine DLL held by the existing dev server. The subsequent
  direct Next build passed against the already generated Feature 20 client.
- Authenticated browser smoke confirmed the desktop route, separate sidebar
  labels, loading and retryable error states, and mobile navigation at
  390x844 with both unambiguous entries and no browser console errors.

## Development Database And Browser Evidence

- The user switched the effective datasource to the development Neon endpoint
  `ep-patient-recipe-acv90rwo-pooler.sa-east-1.aws.neon.tech/neondb`.
- `prisma migrate deploy` applied the five pending versioned migrations and
  `prisma migrate status` then reported all 15 migrations up to date.
- Post-migration reads found zero client payments, operational costs, or
  employee payments missing their backfilled `assignedMonth`; 13 mail tables
  and four official-budget tables are present.
- After restarting the local dev server with network access, authenticated
  browser smoke loaded 10 generator publication controls and the active and
  archived official-budget empty states with no console errors.
- No official budget was published or archived during smoke, so existing
  development commercial data was not mutated beyond the approved migrations.
- No seed, deployment, commit, or push was performed.
