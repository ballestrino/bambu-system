# Current Harness Session

Status: idle

## Active Feature

- None.

## Last Closed Feature

- Feature 33 - `ops_payroll_vacation_salary_counter`.
- Added a `Salario vacacional generado` counter next to `Aguinaldo generado` in
  the employee view payroll summary, plus the matching per-employee metric on
  the Pagos page so the new total keeps a breakdown.
- The accrual is 1/12 of the labor amount net of the base personal BPS
  contributions (8,33% x 0,819 = 6,825% of the hours worked).
- PASS: focused Finance checks (`pnpm check:finance`), TypeScript, full lint,
  and `next build`.
- NOT RUN: authenticated browser smoke. The change needs a signed-in session and
  the agent does not enter credentials; the counter is otherwise covered by the
  focused calculation checks.
- `pnpm build` first failed on a Windows `prisma generate` file lock unrelated
  to this change; `pnpm exec next build` then compiled every route.

## Paused Feature

- Feature 26 - `ops_visits_guided_workflow` remains `pending` without code
  changes. Its responsive visit shell, native status focus correction, and
  iPhone selector/date controls had passed focused checks, TypeScript, lint,
  harness, and Prisma validation; real mobile browser smoke remains pending.
