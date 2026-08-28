# Current Harness Session

Status: active

## Active Feature

- Feature 26 - `ops_visits_guided_workflow`.
- Current slice: adapt create and edit visit presentation so mobile uses a
  bottom sheet aligned with the Visits filter sheet and desktop uses a dialog.
- Preserve the shared occurrence form, validation, submit/remove behavior,
  date/time synchronization, status cards, and assigned archived employees.
- Existing local work from closed Features 24, 29, and 30 remains in the
  worktree and must not be reverted or widened.

## Current Evidence

- `2026-08-28`: baseline `.\init.ps1` passed harness validation, Prisma
  validation, and ESLint before Feature 26 edits.
- Responsive create/edit shell implemented in
  `components/ops/jobs/job-occurrence-dialog-presentation.tsx`; action layout
  is isolated in `job-occurrence-dialog-actions.tsx` and the existing form,
  state, validation, and mutations remain shared.
- PASS: `pnpm check:occurrence-dialog`, TypeScript, focused ESLint, full
  `pnpm lint`, `pnpm harness`, and `git diff --check`.
- Browser smoke remains pending: Playwright CLI had no authenticated local
  session and the integrated-browser attempt was blocked by its usage limit.
- `pnpm build` remains pending because the existing development server locks
  Prisma's Windows query-engine DLL during `prisma generate`; independent
  TypeScript validation is green.
- Temporary smoke route, browser session, and generated artifacts were removed.
- Final `.\init.ps1` passed harness validation, Prisma validation, and full
  ESLint with exactly Feature 26 in progress.
- The four-row Sheet grid keeps the actions stable, but the reported status
  selection issue predates the responsive Sheet and was not caused by it.
- Root correction: the native status radio now covers its visible card instead
  of using a clipped 1 px `sr-only` focus target. Mobile focus therefore stays
  on the tapped card and cannot reanchor the nested form scroller.
- Existing approved Operations work was consolidated locally in commit
  `80b21d6`; the status focus correction is being kept in a separate fix commit.
- Focus correction verification passed `pnpm check:occurrence-dialog`, targeted
  ESLint, TypeScript, and final `.\init.ps1` (harness, Prisma, full lint).
- Local commits are authorized for this correction. No database write, push,
  deploy, or production change is in scope.

## Last Closed Feature

- Feature 30 - `ops_searchable_entity_selects`.
- Closed after final harness/Prisma/lint, authenticated 390x844 and desktop
  browser smoke, keyboard selection, accent-insensitive search, empty feedback,
  form reuse, no-overflow, and no-console-error checks.
- The Edit visit bottom-sheet improvement was planned in pending Feature 26.
  Existing local work was preserved; no database, commit, push, deploy, or
  production change was made.
