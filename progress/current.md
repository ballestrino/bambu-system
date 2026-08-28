# Current Harness Session

Status: idle

## Active Feature

- None.

## Last Closed Feature

- Feature 31 - `ops_finance_pdf_export`.
- Added `Exportar PDF` to the selected Finance month with the existing summary
  calculations and already loaded cobros, costes, and employee payments.
- The branded A4 report includes income, expenses, net result, margin, detailed
  movements, voided-history treatment, page headers/footers, wrapping, and
  stable `finanzas-YYYY-MM.pdf` naming.
- PASS: focused Finance and Finance PDF checks, TypeScript, focused/full lint,
  harness, production build, `git diff --check`, one-page and four-page Poppler
  render review, and authenticated Finance browser smoke.
- Browser smoke confirmed the action visible and enabled, the success toast
  after click, and no console errors. No database, commit, push, deploy, or
  production state changed.

## Paused Feature

- Feature 26 - `ops_visits_guided_workflow` returned to `pending` without code
  changes or reversions when the user explicitly requested Finance export work.
- Its responsive visit shell, native status focus correction, and iPhone
  selector/date controls had passed focused checks, TypeScript, lint, harness,
  and Prisma validation; real mobile browser smoke remained pending.
- Published commits `80b21d6` and `0ba4b79` remain intact. The worktree was
  clean at this transition, despite the prior session note saying the final
  iPhone corrections were uncommitted.
