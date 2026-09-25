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

## 2026-09-08 - Feature 33 payroll vacation salary counter

- Added `vacationSalaryGenerated` to the shared payroll accruals: 1/12 of the
  labor amount net of the base personal BPS contributions, exposed as
  `VACATION_SALARY_ACCRUAL_DIVISOR` and `URUGUAY_VACATION_SALARY_NET_FACTOR`.
- The employee view payroll summary now shows `Salario vacacional generado`
  next to `Aguinaldo generado`, and the Pagos per-employee card shows the same
  metric so the summary total keeps a breakdown.
- Extended `scripts/check-finance.ts` with the new accrual, the null case, the
  payroll row, and the summary total.
- PASS: `pnpm check:finance`, TypeScript, full lint, and `next build`.
- NOT RUN: authenticated browser smoke, which needs a signed-in session.
- No database, deploy, or production state changed.

## 2026-09-08 - Feature 34 accumulated aguinaldo and vacation salary view

- Added `/dashboard/employees/accruals` with a per-employee list of generated
  aguinaldo, salario vacacional, and combined total, a team total row, and
  summary cards for the accumulated totals.
- The Empleados header opens the view with an `Aguinaldo y salario vacacional`
  button. `/dashboard/payroll` was not used as the entry point because no UI
  surface links to it today.
- The period is a date range with `Año actual` (default) and
  `Semestre de aguinaldo` presets, shared through `start` and `end` params.
- Rows reuse `buildPayrollRows`, so employees without hours stay out of the list
  and employees without an hourly rate show `Sin tarifa` and are counted in a
  warning metric instead of being summed as zero.
- Added `scripts/check-employee-accruals.ts` and the `check:employee-accruals`
  script covering the period helpers, the row mapping, and the totals.
- PASS: both focused check scripts, TypeScript, full lint, harness, and
  `next build`.
- NOT RUN: authenticated browser smoke, which needs a signed-in session.
- No database, deploy, or production state changed.

## 2026-09-23 - Feature 35 cronograma semanal en Visitas

- Vista Cronograma en `/dashboard/calendar`, junto a Calendario, Lista y
  Tarjetas: semana de lunes a domingo en America/Montevideo, filtro de
  empleadas, días ocultables, arrastre de día, hora y empleada, alta y edición
  con el diálogo de la visita y nombre de cronograma para trabajos y visitas.
- Avisos de cruces, buscador de huecos libres y disponibilidad por empleada.
  PDF con el logo de Bambú por empleada y del equipo, sin los días ocultos.
- Commits `efd6aa5` y `b598c09`.
- PASS: `check:schedule`, `check:schedule-availability`,
  `check:schedule-move`, `check:schedule-pdf`, TypeScript, lint y
  `next build`.
- PASS: smoke manual del usuario, que lo usa a diario sin problemas. El agente
  no llegó a probarlo con sesión iniciada.

## 2026-09-23 - Feature 28 Finanzas organizada por tarea

- Secciones con `tablist` en desktop y `<select>` nativo en mobile, en
  `?seccion=`. Abrir Finanzas ya no escribe en la base: el sembrado de
  categorías pasó a una acción explícita de admin.
- Carga diferida por sección, Resumen con hero de tres tarjetas y tendencia de
  3 meses de solo lectura (`getFinanceTrend`).
- PASS: `check:finance-trend`, `check:finance`, TypeScript, lint,
  `next build`, harness y smoke autenticado en desktop, claro y oscuro.
- PASS: el usuario la revisó en el celular. Se ve y funciona bien, que era lo
  que faltaba del criterio 7.
- NOT RUN: comparar `updatedAt` antes y después de abrir Finanzas para probar
  que no hay escrituras. Quedó verificado por lectura de código.

## 2026-09-23 - Feature 36 tablas buscables en Finanzas

- Cobros, Costes y Pagos pasaron de tarjetas a tablas compactas ordenables,
  con 25 filas por página y un pie con conteo y total. Hay un buscador por
  sección que ignora acentos y mayúsculas y encuentra montos crudos y
  formateados (`lib/search-text.ts`).
- Selector de vista en `?vista=` y diálogos montados por fila solo mientras
  están abiertos.
- PASS: `check:finance-tables` (nuevo) y las regresiones de Finanzas,
  TypeScript, lint, `next build`, harness, smoke autenticado en Chrome, claro
  y oscuro, y 390x844 emulado.
- Estaba verificada desde el 2026-09-11. Solo esperaba a que la 35 liberara el
  único `in_progress`.

## 2026-09-23 - Feature 37 sueldos a mes vencido

- Commit `3028375`. En Finanzas → Pagos, `/dashboard/payroll` y la ficha de la
  empleada, el saldo del mes M compara sus pagos con las visitas realizadas de
  M−1 (`getPayrollWorkMonth`, `getPayrollPeriod`). Los pagos se siguen
  contando en el mes en que se hacen.
- PASS: `check:finance`, `check:finance-tables`, `check:finance-trend`,
  TypeScript, lint y un recálculo de solo lectura contra la base.
- PASS: smoke manual del usuario.
- Datos: julio tiene 141 visitas `DONE` sin hora real, así que agosto muestra
  saldo −99.524. Los pagos de agosto tienen período 1–31 de agosto aunque
  pagan julio. Son huecos de carga anteriores al cambio.

## 2026-09-23 - Features 38-44 agente de Bambú

- 38: gateway de modelos con modos Bajo, Medio y Alto, proveedores perezosos
  de OpenAI y del Vercel AI Gateway, y costo estimado en USD.
- 39: persistencia `Agent*`, núcleo, 14 tools de lectura, cuatro habilidades,
  `draftEmail` y la ruta `POST /api/agent/chat`.
- 40: `AgentProposal` con tools `propose*`, confirmación atómica e
  idempotente, rechazo, vencimiento a 24 horas y auditoría.
- 41: el agente reemplaza al chat viejo en el Sheet de presupuestos, con modo,
  habilidades, propuestas, historial y costos.
- 42: `/dashboard/agent` con todas las conversaciones y "Abrir en página"
  desde el Sheet.
- 43: "Ver detalle" y "Editar" en las tarjetas, y "Guardar en el generador"
  confirmando una propuesta auditada.
- 44: precio sin IVA al próximo múltiplo de $ 100, productos al múltiplo de
  $ 500 más cercano, `findMatchingBudgets` y respuesta con precio a los mails
  que piden presupuesto.
- Migraciones `20260918120000_agent_workspace` y
  `20260918180000_agent_proposals` aplicadas (21 de 21). Merge `83d7e3b` en
  `main` y push a `origin/main` el 2026-09-22.
- PASS: checks enfocados y de mutación por feature, regresiones del agente,
  oficiales y mail, TypeScript, harness, `next build` y smoke autenticado con
  OpenAI en cada feature. Revisiones aprobadas en `progress/review_*.md`.
  Detalle en `progress/impl_*.md`.
- Cerradas a pedido del usuario el 2026-09-23. Lo que quedó fuera del código
  está en `progress/current.md`.

## 2026-09-23 - Feature 45 modos del agente en gpt-6

- Medio pasa a `gpt-6-luna` con `xhigh` (razona mejor que `gpt-5.6-terra` con
  `high` y cuesta menos) y Alto a `gpt-6-sol` con `medium`. Bajo se retira:
  las conversaciones guardadas en Bajo siguen en Medio, y los mensajes y
  consumos viejos conservan Bajo y su modelo. El enum de la base no cambia.
- Título en `gpt-6-luna` con `medium` y 8.000 tokens de salida (antes
  `gpt-5.6-luna` sin razonamiento y 60 tokens).
- Precios de gpt-6 en la tabla y etiquetas "Luna 6" / "Luna 5.6".
- `AgentUsageEvent.reasoning` (migración
  `20260923160000_agent_usage_reasoning`, aditiva, aplicada en Neon): "Costos
  de IA" separa por modelo y razonamiento ("Luna 6 Extra alto · Medio") y
  pone los títulos en su propia fila.
- PASS: checks del agente con `scripts/ai-mode-checks.ts` y
  `scripts/agent-usage-rows-checks.ts` (y mutaciones que los rompen),
  TypeScript, lint, `pnpm build` y el smoke del usuario.

## 2026-09-23 - Feature 46 precios "+ IVA" y una empleada por defecto

- El agente escribe los precios como "$ 54.100 + IVA" en el chat y en
  `draftEmail` (`PRICE_FORMAT_RULE`), sin "Precio sin IVA" y "Precio con
  IVA". La nota de Literal E sigue debajo de los precios.
- Sin dato de empleadas asume 1 y no pregunta: prompt, habilidades, perfil del
  negocio y `searchOfficialBudgets` del agente con `employees ?? 1`. La
  búsqueda compartida con el agente de correo no cambia.
- PASS: checks del agente con `scripts/agent-price-format-checks.ts`,
  `check:official-budgets`, los tres del correo, TypeScript, lint, build y el
  smoke del usuario.

## 2026-09-23 - Feature 4 acciones de settings seguras

- Las acciones de settings no llamaban a `auth()` y tomaban el id del
  cliente. `updateEmail` además tomaba del cliente el email a reemplazar, y
  eso permitía quedarse con la cuenta de otro.
- Ahora viven en `actions/settings/account.ts` y `security.ts`. Arrancan con
  `getSessionUser()` (`lib/session-user.ts`), validan con
  `schemas/settings.ts` y escriben solo sobre el usuario de la sesión. El
  email a reemplazar sale de la base.
- `data/user.ts`, `lib/tokens.ts` y los `data/*token*` dejaron de ser
  `"use server"`, así que ya no son endpoints públicos. `/settings` pasó a
  Server Component, y se borraron cuatro componentes de 2FA que no usaba
  nadie.
- Hallado en el smoke: los enlaces de los correos (`/auth/new-verification`
  y `/auth/new-password`) mandaban al home a los usuarios logueados. Pasaron
  a `publicRoutes`, y confirmar un cambio de email vuelve a `/settings`.
- PASS: `check:settings-auth` (nuevo, 15 mutaciones detectadas), `tsc`,
  ESLint, `.\init.ps1`, `next build`, el manifiesto de acciones sin helpers
  de auth y el smoke del usuario con sesión (nombre, correo, contraseña y
  2FA). Detalle en `progress/impl_settings_server_action_auth.md`.

## 2026-09-23 - Feature 6 Next.js, React y Auth.js parchados

- `next` y `eslint-config-next` 16.1.1 → 16.3.5 (16.x es la Active LTS).
  React y React DOM 19.2.3 → 19.3.0, con sus tipos. `next-auth` beta.30 →
  beta.32 y `@auth/prisma-adapter` 2.11.1 → 2.11.3, así que queda una sola
  `@auth/core`, la 0.41.3. El lockfile solo cambia dependencias de esos
  paquetes, y no hizo falta tocar código de la app.
- La 16.3.6 (RCE en el `ImageResponse` Node de `next/og`) todavía no pasaba
  el `minimum-release-age` de 24 h de pnpm. La app no usa `next/og`, así que
  el usuario eligió la 16.3.5 y la 16.3.6 queda para después.
- `pnpm audit --prod`: de 6 críticas y 42 altas a 0 críticas y 22 altas.
  `next`, `next-auth`, `@auth/core` y `sharp` salen del reporte.
- `scripts/agent-usage-rows-checks.ts` (de la 45) ahora normaliza CRLF, igual
  que los demás checks.
- PASS: `tsc`, lint, `next build`, los 25 `check:*`, el dev sin sesión, y el
  smoke con sesión en el Chrome del usuario: navegación del dashboard, el
  agente en Medio y un login nuevo con credenciales. Detalle en
  `progress/impl_platform_dependency_patch_review.md`.

## 2026-09-23 - Feature 3 permisos de presupuestos y categorías

- Decisión del usuario: presupuestos y categorías son un espacio compartido
  entre admins. `Budget.userId` guarda el autor, y queda documentado en
  `docs/architecture.md`.
- Las acciones de categorías no pedían sesión, y las lecturas de
  `data/budget*` eran `"use server"`, así que eran endpoints públicos. Ahora
  todas las lecturas y acciones de presupuestos y categorías pasan por
  `getBudgetAdminSession` (`lib/budget-admin.ts`) y validan con schemas
  (`BudgetIdSchema`, `BudgetSlugSchema` y `schemas/budget-category.ts`).
- Las lecturas son `server-only`, y el cliente las usa por archivos de
  lectura `"use server"`, como los oficiales. Duplicar deja de exigir ser el
  autor, también en el agente, al proponer y al confirmar.
- Se sacaron los cinco `console.log` de los flujos de presupuestos.
- PASS: `check:budget-auth` (nuevo, 16 de 16 mutaciones), los 25 `check:*`,
  `tsc`, ESLint, `.\init.ps1`, `next build`, el manifiesto sin acciones de
  `data/` ni `lib/`, y el smoke con sesión en el Chrome del usuario: crear,
  editar, duplicar y borrar un presupuesto y una categoría de prueba, que se
  borraron. Detalle en `progress/impl_budget_authorization_contracts.md`.

## 2026-09-23 - `next` 16.3.6 (seguimiento de la feature 6)

- `next` y `eslint-config-next` 16.3.5 → 16.3.6, cuando pasó el
  `minimum-release-age` de pnpm. Corrige la RCE de `ImageResponse` en
  `next/og` (GHSA-vcvr-r3jv-pc5j), que esta app no usa. El lockfile solo
  cambia la familia de Next y deduplica `semver`.
- `pnpm audit --prod` sigue en 0 críticas, sin avisos de `next`.
- PASS: `tsc`, lint, los 26 `check:*`, `next build` desde cero y un smoke
  con sesión en el Chrome del usuario, con `.next` borrada: Resumen,
  Presupuestos, Finanzas y el agente, sin errores en el servidor.

## 2026-09-23 - `maxDuration` del agente a 300 s

- En las últimas 12 horas, Observability de Vercel mostró 20 llamadas a
  `/api/agent/chat` con 33 % de timeouts a los 60 s. Cada turno usa unos
  2,8 s de Active CPU (P75); el resto es esperar a OpenAI.
- Fluid compute está activo en el proyecto (Hobby: máximo de 300 s), así que
  `maxDuration` pasó de 60 a 300 s, solo en la ruta del agente. El cron de
  correo sigue en 60 s. Se actualizó `docs/agent.md`.
- Quedó confirmado en Vercel: Node 24.x, y `OPENAI_API_KEY` funciona en
  producción (94 llamadas a OpenAI en 12 horas). Se cerró ese pendiente.

## 2026-09-24 - Feature 9 generación manual de visitas

- Las lecturas de visitas (`getJobOccurrences` y `getVisitWeek`) ya no
  generan. Tampoco generan crear o editar una regla. Las visitas se generan a
  mano para un rango "desde/hasta" con "Generar visitas":
  - en el Cronograma, la semana;
  - en el Calendario, la semana del día, el mes o del día a fin de mes;
  - en las reglas del trabajo, 7 días, hasta fin de mes o 4 semanas.
- Antes de escribir se ve una vista previa. Se pueden generar días pasados,
  con aviso, y nunca más allá del horizonte de 3 meses.
- A pedido del usuario, el mismo diálogo reemplaza las visitas futuras sin
  tocar que ya no coinciden con su regla: día u horario, duración, equipo o
  regla inactiva. Nada viene marcado. Las marcadas se borran, porque no tienen
  datos propios, y se recrean. En producción había 184 del 24/9 al 22/11.
- El diálogo de visita carga empleadas, trabajos y reglas al abrirse. Visitas
  bajó de 13 acciones y 3,77 s a 2 acciones y 1,38 s (mediana de 3 cargas).
- PASS: `check:occurrence-generation` (nuevo, 21 de 21 mutaciones), los 27
  `check:*`, `tsc`, lint, build y el smoke. Se generaron, con permiso, 2
  visitas reales del 21/9, y el usuario probó crear, editar, separar, archivar
  y reemplazar. Detalle en
  `progress/impl_ops_occurrence_scheduling_refactor.md`.

## 2026-09-24 - Limpieza y renumeración del feature_list

- `feature_list.json` pasó de 46 features (40 `done`, 6 `pending`) a 20:
  10 terminadas como contexto (1–10, con `legacyId`) y la cola nueva (11–20),
  ordenada por prioridad. Cada feature tiene `area`. Las otras 30 terminadas
  quedan en este historial y en git.
- Toda mención "feature N" anterior a esta entrada (acá, en `progress/impl_*`,
  `progress/review_*`, `docs/agent-plan.md` y los commits) usa la numeración
  vieja. En código, scripts y docs vigentes se reemplazaron por nombres.
- Terminadas que quedan como contexto:

  | Nuevo | Viejo | `name` |
  |---|---|---|
  | 1 | 3 | `budget_authorization_contracts` |
  | 2 | 6 | `platform_dependency_patch_review` |
  | 3 | 9 | `ops_occurrence_scheduling_refactor` |
  | 4 | 29 | `ops_visits_mobile_controls_compaction` |
  | 5 | 32 | `job_form_dialog_trigger_fix` |
  | 6 | 34 | `ops_employee_accruals_view` |
  | 7 | 35 | `ops_weekly_schedules` |
  | 8 | 36 | `ops_finance_searchable_tables` |
  | 9 | 37 | `ops_payroll_paid_in_arrears` |
  | 10 | 43 | `agent_budget_editor` |

- Pendientes viejas a nuevas, con criterios revisados contra `main`:

  | Vieja | Nueva |
  |---|---|
  | 5 `runtime_lazy_sdk_initialization` | 15 `runtime_sdk_cleanup` |
  | 8 `budget_form_and_cache_refactor` | 14 `budget_query_cache` y 19 `budget_form_sections` |
  | 11 `client_boundaries_and_cleanup` | 15 y 19 (settings ya estaba hecho) |
  | 25 `ops_contextual_period_locale` | 16 `ops_es_uy_locale` y 18 `ops_contextual_period` |
  | 26 `ops_visits_guided_workflow` | 17 `ops_visits_guided_intents` |
  | 27 `ops_coordination_lists` | 20 `ops_coordination_lists` |

- Nuevas: 11 `security_dependency_patch`, 12 `payroll_data_gaps` y
  13 `agent_test_data_cleanup`.
- Descartado:
  - Cloudinary (se retira en la 15);
  - el helper de ownership y la sección de mano de obra de la vieja 8;
  - las páginas cliente de presupuestos oficiales de la vieja 11;
  - los criterios de la vieja 26 que ya se cumplieron: el Sheet de filtros y
    el Sheet de visita.
- Los checks del agente dejaron de afirmar ids viejos de `feature_list.json`.
- Los planes cumplidos de `plans/` (local) pasaron a `plans/archive/`.
