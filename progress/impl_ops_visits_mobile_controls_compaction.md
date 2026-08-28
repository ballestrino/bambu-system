# Implementation Report - ops_visits_mobile_controls_compaction

Status: done

## Implemented

- Kept the selected-month control above Operations and made its mobile layout
  a single non-wrapping row with a flexible month field and 44 px actions.
- Replaced the open mobile Visits filter panel with a local shadcn bottom sheet
  while preserving immediate filtering, result counts, active chips, clear-all,
  and the existing desktop fields.
- Rendered the three calendar totals as one compact mobile row and retained the
  existing metric cards from the `sm` breakpoint upward.
- Removed the repeated planned time from agenda cards and increased the
  employee line to medium weight without changing its muted color.

## Architecture

- No query, Server Action, schema, persistence, authorization, occurrence, or
  filter-state contracts changed.
- `CalendarFiltersBar` keeps its existing props. The bottom sheet is scoped to
  Visits so other Operations filter sheets retain their current behavior.
- All touched authored files remain below the 200-line guidance.

## Verification

- `pnpm lint`: passed.
- `.\init.ps1`: passed harness validation, Prisma validation, and repository
  lint. A full build was not required by the UI-only verification matrix.
- Authenticated browser smoke passed at 390x844 and 1440x900. The isolated
  Playwright CLI profile had no safe reusable login state, so the authenticated
  run used the integrated browser's Playwright surface rather than reading or
  modifying credentials.
- At 390x844, horizontal overflow was zero; month actions measured 44 px, the
  month field stayed on the same row, and previous/next restored `2026-08`.
- The bottom sheet aligned to the viewport bottom, exposed all contextual
  fields, applied and cleared attention state, closed through `Listo` and
  Escape, and kept its active badge and chips outside the sheet.
- Exact date was visible in Lista and Cards and absent from Calendario. The
  three metrics shared one horizontal row. A real agenda card showed the
  planned range once and its employee text computed at weight 500.
- Desktop retained expanded filters and the original large metric cards. The
  successful authenticated run produced no browser console warnings or errors.
- `pnpm exec tsc --noEmit` was attempted but the repository has no standalone
  `tsc` executable; route compilation, lint, and browser rendering were green.

## Boundaries

- The browser-native month input still renders its internal month text using
  the browser locale; localization remains owned by pending Feature 25.
- No database write, migration, permission change, commit, push, deploy, or
  production change was made.
