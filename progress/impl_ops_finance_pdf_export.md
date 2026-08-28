# Implementation - Feature 31 Finance PDF export

## Scope

- Added `Exportar PDF` to Finance actions for the selected operational month.
- Reused the Finance workspace records and `getFinancialSummary` result.
- Added a small shared PDF primitive module with WinAnsi text support.
- Added report data mapping, branded multi-page layout, download behavior, and
  a focused executable check.

## Report contents

- Summary: recorded income, recorded expenses, net result, and margin.
- Income: client payment date, job, reference, notes, status, and amount.
- Expenses: operational cost category/job/employee plus employee payment
  period, reference, notes, status, and amount.
- Voided movements remain visible but are excluded from recorded totals.
- Long rows wrap, continuation pages repeat their section header, and the
  filename is `finanzas-YYYY-MM.pdf`.

## Boundaries

- No new dependency, route, server action, schema, migration, or database write.
- No commit, push, deploy, or production change.
