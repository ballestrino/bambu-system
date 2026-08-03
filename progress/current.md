# Current Harness Session

Status: in_progress

## Active Feature

Feature 9 - `ops_occurrence_scheduling_refactor`

## Notes

- Improving the create/edit visit dialog date, time, and status controls.
- Scope for this session: split combined datetime inputs, synchronize an empty
  end date from its start date, and render the four mutually exclusive statuses
  as inline cards.
- Implemented separate date/time controls for scheduled and actual ranges.
- Date range updates are atomic: setting a start date fills an empty end date,
  while an existing end date is preserved.
- Replaced the status select with four accessible radio cards in one row.
- Split dialog form, date/time controls, status controls, and submit behavior
  into authored files under 200 lines.
- Verification: `pnpm check:occurrence-dialog`, `tsc --noEmit`, and
  `.\init.ps1` passed on 2026-08-03.
- Authenticated Chrome smoke at `/dashboard/calendar` passed: create dialog
  rendered the split controls, empty end-date synchronization returned
  `2026-08-10`, an existing `2026-08-12` end date was preserved after changing
  the start to `2026-08-11`, and selecting `Realizada` left exactly one radio
  checked. No application console errors were observed.
- Added an explicit, confirmed `Eliminar visita` action to the edit dialog. It
  uses the existing recoverable occurrence archive path and leaves create mode
  unchanged.
- Authenticated browser smoke passed: edit mode showed one destructive button,
  its confirmation explained that the visit leaves the active calendar and
  history, cancel returned to edit mode, and create mode showed no delete
  action. The destructive confirmation was not executed, so test data was not
  changed. No application console errors were observed.
- Editing a visit now merges its existing team with the active employee list,
  so assigned archived or inactive employees remain visible, are labeled, and
  can be removed without exposing unrelated archived employees for assignment.
- Authenticated browser smoke covered the reported case on the `Edificio Minas`
  visit: Rosa and María were assigned, María appeared checked with the
  `Inactiva` label, and her checkbox changed to unchecked. The dialog was
  canceled without saving, so production-like test data was not modified. No
  application console errors were observed.
- Operational data cleanup requested on 2026-08-03: all 396 visits scheduled
  from 2026-05-01 through 2026-07-31 in `America/Montevideo` were marked
  `DONE`, and their 323 employee assignments were removed atomically. A
  post-update database query confirmed 127 May, 128 June, and 141 July visits,
  with 396 `DONE`, zero other statuses, and zero employee assignments. The one
  already archived occurrence remains archived.
