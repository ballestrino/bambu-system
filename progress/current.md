# Current Harness Session

Status: in_progress

## Active Feature

- Feature 35 - `ops_weekly_schedules`.
- The weekly schedule is now a **view inside `/dashboard/calendar`** (Calendario ·
  Cronograma · Lista · Tarjetas), not a separate route. `/dashboard/schedules`,
  its data layer, action, hook and schema were removed: the board reads through
  the existing `useJobOccurrences` for the week range, so it shares the cache and
  the optimistic updates with the rest of Visitas.
- Schema: `Job.scheduleName` and `JobOccurrence.scheduleLabel`
  (`20260910120000_schedule_display_names`, applied). The visit override wins
  over the job alias, and the internal name is the fallback
  (`getScheduleDisplayName`). The board shows the schedule name with the internal
  one underneath; the PDF only carries the schedule name.
- `opsOccurrenceInclude` now selects `scheduleName`, `serviceAddress` and
  `serviceLocation`, and `getJobOccurrences` uses that shared include instead of
  its own inline copy.
- Drag and drop uses **pointer events**, not HTML5 drag and drop: the native API
  does nothing on touch, and administration also builds the schedule on a tablet.
  Only the grip starts a drag (`touch-action: none`), so touch scrolling still
  works. `shiftOccurrenceToDate` recomposes the local date instead of adding
  milliseconds, preserving the local time and the day span of overnight visits.
- The visit dialog is now controllable from outside (`open`/`onOpenChange`) and
  accepts `defaults`, so a day cell opens it prefilled with that date, a 09:00 to
  13:00 slot and the row's employee. Clicking a visit opens the same dialog to
  edit or delete.
- The employee picker in the dialog and the board filter both use the new
  `SearchableMultiSelect`, matching the job filter in Visitas. With 12+ employees
  the old checkbox list was unusable.
- `visibleWeekdays` is remembered per browser and is honoured by the grid, the
  mobile list and both PDFs.
- PASS: `pnpm check:schedule`, `check:schedule-pdf`, `check:finance-pdf`,
  `check:finance`, `check:employee-accruals`, `check:profitability`,
  `check:occurrence-dialog`, `check:job-export`, `check:official-budgets`,
  `check:mail-agent`, TypeScript, full lint, harness, `prisma validate` and
  `pnpm build`.
- PASS: authenticated browser smoke on the real database. Verified the week grid
  with live data, the weekday toggle hiding and restoring Sunday, the employee
  multi-select narrowing the rows, the visit dialog opening from a card with the
  new schedule-name field, the employee search matching without accents
  (`fabian` finds `Fabián`), the day cell opening a prefilled Crear visita, and
  both PDF downloads (`cronograma-lorena-2026-09-07.pdf` 31 KB,
  `cronogramas-equipo-2026-09-07.pdf` 37 KB) honouring the employee filter.
- PASS: drag verified in the browser at the DOM level (the target day cell
  highlights and the drop fires the update), plus a transactional probe against
  the real database confirming the shifted dates and `scheduleLabel` persist.

## Blocked Verification

- Writes fail in this browser session with
  `Foreign key constraint violated: JobOccurrence_updatedById_fkey`. The NextAuth
  JWT carries `user.id = cmm82smv300000hk8oewf4ssb`, which does not exist in the
  database (`.env` and `.env.local` both point at the same Neon instance, whose
  admins are `cmkfuiovi…`, `cmkcszlfy…` and `cmkmt75m6…`). This is a stale
  session cookie, not a regression: every write path in the app sets
  `updatedById`/`createdById` from the session. **Sign out and back in**, then
  re-check the drag, create and delete flows end to end.
- NOT RUN: 390x844 smoke. The Chrome window would not resize from the tooling.
  The mobile list renders in the DOM with the right content and the document has
  no horizontal overflow, but it was not seen at that width.

## Paused Feature

- Feature 26 - `ops_visits_guided_workflow` remains `pending` without code
  changes. Its responsive visit shell, native status focus correction, and
  iPhone selector/date controls had passed focused checks, TypeScript, lint,
  harness, and Prisma validation; real mobile browser smoke remains pending.
