# Harness History

## 2026-06-15 - harness_bootstrap

- Added the multi-agent harness structure inspired by
  `betta-tech/ejemplo-harness-subagentes`.
- Adapted the checks and documentation to Bambu System's Next.js, Prisma,
  NextAuth, TanStack Query, and shadcn/Tailwind stack.
- Verification: `.\init.ps1` passed on 2026-06-15. The script ran harness
  validation, Prisma validation, and ESLint. `pnpm build` was skipped because
  `HARNESS_FULL` was not set.

## 2026-06-15 - codex_subagents

- Removed `CLAUDE.md`; Codex reads `AGENTS.md` directly.
- Replaced Claude-specific required agent files with Codex subagent profiles in
  `.codex/agents/`.
- Verification: `.\init.ps1` passed on 2026-06-15. The script ran harness
  validation, Prisma validation, and ESLint. `pnpm build` was skipped because
  `HARNESS_FULL` was not set.

## 2026-07-27 - budget_hourly_target_product_margin

- Added numeric total and hourly service-price targets that derive the service
  margin while excluding IVA and products.
- Kept the selected target synchronized when hours or costs change and clamped
  targets below service cost to zero margin.
- Disabled product margin by default, retained the optional 15 percent margin,
  and showed hourly prices with and without products in preview and details.
- Verification: focused calculation checks, TypeScript, ESLint, production
  build, authenticated browser smoke for create/edit flows, and `.\init.ps1`
  passed.

## 2026-07-29 - budget_recent_searches

- Persisted the five most recent unique, non-empty budget searches in
  localStorage and displayed them from the search field.
- Made recent terms selectable so they rerun the search and move to the front
  of the history.
- Verification: ESLint, harness validation, and authenticated browser smoke
  passed. Browser smoke confirmed the five-item limit, selection, reordering,
  and persistence after reload. The remote development database was
  unavailable, which did not block the client-side interaction under test.

## 2026-07-29 - calendar_operational_filters

- Added composable calendar filters for job, employee (including unassigned),
  visit status, and visits that require attention.
- Applied the filtered result consistently to month markers, metrics, and the
  selected-day agenda, with removable chips, result counts, reset controls,
  and a filter-aware empty state.
- Stabilized calendar day attributes across server and browser locales to
  avoid calendar hydration mismatches.
- Verification: focused ESLint, TypeScript, full `.\init.ps1`, and
  authenticated browser smoke passed. Browser smoke covered combined job and
  employee filters, status with no results, reset, attention-only filtering,
  and visual layout.

## 2026-07-29 - job_budget_option_net_price

- Changed the job form's budget option selector to derive and display the
  option price without IVA instead of rendering the stored gross amount.
- Reused the shared job budget pricing rules and labeled both the dropdown
  option and selected-option summary as `sin IVA`.
- Verification: focused net-price calculations, ESLint, authenticated browser
  smoke on the create-job dialog, and final `.\init.ps1` passed.

## 2026-08-01 - job_excel_export

- Added an `Exportar Excel` action to the jobs header that queries on demand
  with the current search, status, visibility, and archived filters.
- Generated a styled, filterable `.xlsx` with frozen headers, typed currency
  and date cells, snapshot-aware job prices, formula-driven hourly prices, and
  the relevant operational workload fields.
- Simplified budget information to its name, product inclusion, and included
  product price; removed status, reference, audit identities, pricing
  internals, archive metadata, and technical identifiers.
- Hardened the archived filter so jobs with either an archived date or
  `ARCHIVED` status stay hidden unless `Incluir archivados` is enabled.
- Added a focused executable check covering IVA removal, weekly workload,
  hourly-price calculation, formulas, empty cells, table structure, save, and
  reopen behavior.
- Verification: focused export check, artifact inspection and render with no
  formula errors, ESLint, Prisma validation, harness validation, the original
  production build, and final `.\init.ps1` passed. Authenticated browser smoke
  confirmed `Edificio La Paz` is hidden with archived jobs disabled, appears
  when enabled, and exports exactly one filtered row. A refinement build rerun
  remained unavailable while the user's active Next dev server held Prisma's
  Windows engine DLL; the global TypeScript rerun only reported unrelated
  in-progress visit-feed errors.

## 2026-08-01 - visits_multi_view_infinite_history

- Renamed the operational calendar surface to Visitas while retaining its
  route, monthly calendar, daily agenda, metrics, markers, and actions.
- Added Calendar, compact List, and responsive Cards modes with local mode
  persistence and shared job, employee, status, and attention filters.
- Added a newest-first weekly TanStack infinite feed that starts from the
  operational month anchor, skips empty weeks, and loads older visits as the
  viewport reaches the end.
- Added stable filter-option loading plus a separate infinite-query cache root
  invalidated after visit, assignment, employee, and job mutations.
- Stabilized the current-month query anchor by memoizing it per month, fixing
  the endless Compiling/Rendering loop when opening List or Cards.
- Verification: focused weekly boundary/cursor/filter checks, TypeScript,
  ESLint, Prisma validation, harness validation, direct Next production build,
  and authenticated browser smoke passed. Browser smoke covered view
  persistence, shared filters, responsive cards, and automatic loading from 35
  to 65 visits without duplicate rendering. The `pnpm build` wrapper could not
  rerun `prisma generate` while the active Windows dev server held Prisma's DLL;
  the subsequent Next build compiled and generated all 23 routes successfully.

## 2026-08-02 - ops_finance_domain_refactor

- Added the unified `/dashboard/financial` workspace with monthly Resumen,
  Cobros, Costes, and Pagos sections, independent filters and retry states,
  reusable dialogs, employee attribution, categories, BPS, and payroll tools.
- Replaced the three finance navigation entries with Finanzas while preserving
  `/dashboard/payments`, `/dashboard/costs`, and `/dashboard/payroll`.
- Added and deployed the required `EmployeePayment.assignedMonth` migration,
  including backfill and indexes, and centralized monthly finance rules under
  `lib/ops/finance`.
- Verification: focused finance checks, TypeScript, ESLint, Prisma validation,
  direct Next production build, harness validation, and authenticated desktop
  and mobile smoke passed. The final post-migration smoke loaded all four
  sections with zero data-load errors and the expected August financial total.

## 2026-08-06 - ops_finance_domain_refactor follow-up

- Added informational generated aguinaldo and the fixed personal plus employer
  BPS base to monthly and per-employee payroll summaries without changing
  recorded costs, outgoings, or profit.
- Improved payroll card layout and kept recorded payments in a separate panel.
- Made visit completion preload real times consistently and preserve manually
  adjusted times when scheduled dates move.
- Verification: focused finance and occurrence checks, TypeScript, ESLint,
  production build, harness validation, and authenticated Finance smoke passed.

## 2026-08-13 - job_profitability_alerts

- Added reusable monthly and historical service-profitability calculations
  using net budget economics, attributable completed-visit labor and transport,
  and job-linked operational costs while reporting collection separately.
- Added batch reads and cache invalidation plus severity-aware alerts on the
  dashboard, the full Finance section, job cards and filters, and job detail.
- Verification: focused profitability, finance, and occurrence checks,
  TypeScript, ESLint, Prisma validation, direct Next production build, and the
  final `\.\init.ps1` passed.
- Authenticated desktop and 390-by-844 browser smoke passed on dashboard,
  Finance, jobs, and job detail with no console errors or horizontal overflow.
