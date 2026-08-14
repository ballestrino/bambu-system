# Implementation Report - job_profitability_alerts

## Scope

- Added a reusable operational-profitability domain that compares net budget
  revenue and expected profit with attributable labor, transportation, and
  job-linked costs.
- Added monthly and historical batch reads, authenticated Server Actions,
  TanStack Query integration, shared cache keys, and mutation invalidation.
- Added severity-aware surfaces to the dashboard, Finance, jobs list, and job
  detail without treating collection timing as service profitability.

## UI

- Dashboard: compact highest-priority alerts and healthy state.
- Finance: complete searchable and filterable profitability section with a
  local collapse control and bounded internal scrolling.
- Jobs: profitability badges and attention filter.
- Job detail: monthly and historical operational-finance breakdowns.

## Verification

- `pnpm check:profitability` passed.
- `pnpm check:finance` passed.
- `pnpm check:occurrence-dialog` passed.
- TypeScript and ESLint passed during implementation.
- Direct Next production build generated all protected surfaces after the
  configured Google fonts were available.
- Final `\.\init.ps1` passed harness validation, Prisma validation, and lint.
- Authenticated browser smoke passed on dashboard, Finance, jobs, and a job
  detail in desktop and 390-by-844 responsive viewports.
