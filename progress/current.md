# Current Harness Session

Status: idle

## Active Feature

- None.

## Last Closed Feature

- Feature 34 - `ops_employee_accruals_view`.
- Added `/dashboard/employees/accruals`: lista por empleada con aguinaldo,
  salario vacacional y total generado en el periodo, mas la fila de total del
  equipo y las tarjetas de total acumulado.
- The Empleados header now has an `Aguinaldo y salario vacacional` button that
  opens the view. `/dashboard/payroll` was not used as the entry point because
  nothing in the UI links to it today.
- Period is a date range with `Año actual` (default) and `Semestre de aguinaldo`
  presets, kept in `start` and `end` search params.
- PASS: `pnpm check:employee-accruals` (new), `pnpm check:finance`, TypeScript,
  full lint, harness, and `next build` with the new route registered ahead of
  `/dashboard/employees/[id]`.
- NOT RUN: authenticated browser smoke. The view needs a signed-in session and
  the agent does not enter credentials.

## Paused Feature

- Feature 26 - `ops_visits_guided_workflow` remains `pending` without code
  changes. Its responsive visit shell, native status focus correction, and
  iPhone selector/date controls had passed focused checks, TypeScript, lint,
  harness, and Prisma validation; real mobile browser smoke remains pending.
