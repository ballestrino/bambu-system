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

## 2026-08-14 - shared_mail_ai_agent

- Added the administrator-only shared Hostinger mailbox with bounded IMAP
  synchronization, real folder movement, SMTP delivery, attachments, thread
  repair, search, drafting, shared approved memory, feedback, guarded
  automation rules, queues, audit, and a protected cron endpoint.
- Added Terra high and xhigh structured drafting, retrieval over approved
  sources, protected-literal and commercial safety gates, and a default-off
  automatic-send master switch.
- Verification: focused mail-agent checks, TypeScript, Prisma validation,
  repository ESLint, direct Next production build, controlled migration
  readback, and authenticated desktop and responsive browser evidence passed.
- Closure remains local and documented: the additive migration was validated
  on temporary Neon branch `br-snowy-forest-ac5f7u9o`; production promotion,
  deployment secrets, cron-job.org activation, and enabling automatic rules
  still require explicit approval.

## 2026-08-14 - official_budget_versioning

- Added separate OfficialBudget, immutable OfficialBudgetVersion, option
  snapshot, and audit persistence using Decimal for new monetary fields.
- Publishing creates version 1 atomically; authenticated edits to an actively
  linked generator append serialized versions without retaining mutable option
  IDs. Concurrent publish, edit, and archive paths use row locks or conditional
  updates.
- Snapshots preserve service metadata, workload, inputs, fixed authoritative
  prices, IVA, hourly price, and explicit estimated calculation breakdowns.
- Archive detaches the generator while retaining versions. Linked generator
  deletion is rejected by the admin action and an ON DELETE RESTRICT foreign
  key; database triggers reject version or option mutation.
- Verification passed: focused official-budget checks, Prisma validation,
  read-only semantic migration diff, TypeScript, repository lint, production
  build, and final harness init. No migration was applied or deployed.

## 2026-08-24 - Feature 21 official budget workspace separation

- Separated the existing generator from the new official-budget list/detail
  workspace and added distinct desktop/mobile navigation.
- Added guarded publication/archive controls, generator indicators, immutable
  version breakdowns, and coherent TanStack Query invalidation.
- Applied five pending versioned migrations to the user-designated development
  Neon, bringing it from 10/15 to 15/15 with backfill invariants green.
- Focused Feature 20/21 checks, Prisma, lint, TypeScript, 27-route build,
  harness, and authenticated desktop/mobile browser smoke passed.
- No official record, seed, production deploy, commit, or push was created.

## 2026-08-25 - Feature 22 mail official budget search and sources

- Added strict official-budget search for mail drafting, immutable revision
  sources, internal bibliography, mismatch warnings, and fail-closed price
  automation boundaries.
- Changed mail generation to `gpt-5.6-luna` with `reasoning.effort: xhigh` on
  every draft and updated the user-facing model label.
- Applied migration `20260825120000_mail_official_budget_sources` only to the
  user-confirmed Neon development branch; status reached 16/16 migrations.
- Focused checks, Prisma, TypeScript, lint, production build, and authenticated
  local browser evidence passed. The exact official price and bibliography
  survived archival; no email was sent and automatic sending remained off.
- Removed the two synthetic mail threads, two test rules, and one test official
  budget. Final readback confirmed zero matching fixtures remained.

## 2026-08-25 - Feature 23 conversational mail draft editor

- Added immutable conversational/manual/restored draft revisions, complete
  history, exact-revision feedback, and distinct useful, not-useful, copied,
  saved, external-use, Bambú-send, and automation-confirmation semantics.
- Preserved official bibliography through every edit path, bounded Luna context
  with `store: false`, cancelled stale automation queues, and blocked official
  price mismatches at rule, matching, and delivery boundaries.
- Applied migration `20260825170000_mail_conversational_draft_editor` only to
  confirmed Neon development branch `br-royal-band-acu9vn62`; readback confirmed
  the new columns and database guards. Production remained unchanged.
- Focused mail checks, Prisma, full lint, build/TypeScript, final harness init,
  and authenticated desktop/mobile fixture smoke passed without console errors
  or horizontal overflow. Temporary QA assets were removed; no email was sent
  and no draft, rule, or queue record was left behind.

## 2026-08-27 - Feature 24 operations visual foundation and daily dashboard

- Added light/dark Operations tokens and replaced decorative green borders,
  static shadows, gradients, and pill-shaped controls with neutral surfaces,
  consistent radii, solid primary actions, and accessible focus treatments.
- Reordered the dashboard around daily visits, grouped operational and
  financial summaries, and secondary profitability information.
- Added retryable section errors so query failures cannot appear as real zero
  values, and split dashboard query orchestration into a focused hook.
- Lint, production build/TypeScript, final init, contrast checks, and
  authenticated desktop/mobile browser smoke passed in light and dark themes.
- No database, permission, business-rule, commit, push, deploy, or production
  change was made. Feature 25 remains pending and was not started.

## 2026-08-28 - Feature 29 Visits mobile controls and card compaction

- Kept the monthly selector visible in one mobile row and moved only the other
  Visits filters into a shadcn bottom sheet with immediate state, active chips,
  clear-all, `Listo`, and Escape behavior.
- Compacted Visitas, Realizadas, and Pendientes into one mobile row, removed the
  duplicated planned time from agenda cards, and strengthened employee text
  without changing its color.
- Final init passed harness, Prisma validation, and lint. Authenticated 390x844
  and desktop browser smoke passed with no horizontal overflow or console
  errors; Lista/Cards kept exact date and Calendario did not expose it.
- No query, schema, persistence, database, permission, commit, push, deploy, or
  production change was made. Features 25 through 28 remain pending.

## 2026-08-28 - Feature 30 searchable operational entity selectors

- Added one shared shadcn Popover + Command single selector with bounded
  scrolling, keyboard selection, empty feedback, and case- plus
  accent-insensitive search.
- Migrated long work, employee, and cost-category choices throughout Visits,
  Finance, assignments, and employee visit history while leaving short status
  and frequency enumerations unchanged.
- Final init passed harness, Prisma validation, and lint. Authenticated 390x844
  and desktop browser smoke passed inside the Visits filter sheet, the Create
  visit dialog, and Receivables with no overflow or console errors.
- Planned the Edit visit mobile bottom sheet in pending Feature 26 with a shared
  form/state contract, scrollable body, stable footer, safe-area handling, and
  unchanged desktop/create presentations. No database, commit, push, deploy, or
  production change was made.

## 2026-08-28 - Feature 32 job form dialog trigger fix

- Restored the shared create/edit job dialog trigger by forwarding the Radix
  event, accessibility, and ref props through `JobFormTrigger` to `Button`.
- Authenticated browser evidence first reproduced the inert button and then
  confirmed both the complete Create dialog and a populated Edit dialog open
  with no client console errors. The temporary Edit fixture was removed.
- TypeScript, full lint, harness, `git diff --check`, and final init passed.
- Feature 31 Finance PDF work remains preserved and pending. No database,
  commit, push, deploy, or production change was made.

## 2026-08-28 - Feature 31 monthly Finance PDF export

- Added a visible `Exportar PDF` action for the currently selected Finance
  month using the workspace data and the same recorded totals as the screen.
- The branded multi-page report summarizes income, expenses, result, and
  margin, then details client payments, operational costs, and employee
  payments with dates, references, notes, statuses, and payroll periods.
- Voided movements remain visible in a distinct historical treatment and are
  excluded from totals. Long labels wrap, table headers repeat, and every page
  has period context and numbering.
- Focused checks, TypeScript, lint, harness, production build, authenticated
  browser smoke, and visual Poppler inspection of one- and four-page reports
  passed. Temporary render artifacts were removed; no database, commit, push,
  deploy, or production change was made.
