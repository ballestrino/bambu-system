# Implementation Report - ops_searchable_entity_selects

Status: done

## Implemented

- Added a shared single-value `SearchableSelect` built from the existing
  shadcn Popover, Command, and Button primitives.
- Added bounded scrolling, empty feedback, selection state, keyboard support,
  and case- plus accent-insensitive label search.
- Migrated long work, employee, and cost-category selectors across Visits,
  Costs, Receivables, Payroll, assignments, and employee visit history.
- Preserved special options such as Todos, Sin asignar, Sin trabajo, and Sin
  empleada. Short status, recurrence, and timing enumerations remain normal
  Select controls.

## Architecture

- The shared component accepts existing filter and form control classes, so
  consumers retain their visual context without duplicating combobox logic.
- Values and `onValueChange` contracts remain strings; no query, Server Action,
  schema, persistence, authorization, or database behavior changed.
- All touched authored files remain at or below the 200-line guidance.

## Verification

- `pnpm lint`: passed.
- Authenticated browser smoke passed at 390x844 and 1440x900 on Visits and
  Receivables, including a searchable selector inside the mobile filter sheet
  and inside the Create visit dialog.
- Keyboard Enter selected the filtered option. Empty feedback rendered for an
  unmatched query. Searching `maria` matched names containing `María`, proving
  accent-insensitive filtering.
- Mobile document width stayed at 390 px with no horizontal overflow; desktop
  popovers matched their trigger width. No browser console errors appeared.
- `pnpm exec tsc --noEmit` was attempted, but this repository does not expose a
  standalone `tsc` executable. The required lint and rendered route checks are
  green.

## Boundaries

- The existing specialized budget-source combobox remains responsible for its
  server-side paginated search. Small enumerated selects were intentionally not
  changed.
- No database write, migration, permission change, commit, push, deploy, or
  production change was made.
