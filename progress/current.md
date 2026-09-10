# Current Harness Session

Status: in_progress

## Active Feature

- Feature 35 - `ops_weekly_schedules`.
- New `/dashboard/schedules?week=YYYY-MM-DD&employeeId=` panel: Monday-to-Sunday
  team grid on desktop, per-employee cards below `lg`, and a dedicated employee
  panel that mirrors what the PDF contains.
- `data/ops/schedules.ts` is a dedicated read: it calls
  `ensureJobOccurrencesForRange` first so future weeks are materialized, then
  loads active employees plus the week's occurrences with
  `serviceAddress`/`serviceLocation`, which `getJobOccurrences` does not select.
- Day bucketing uses local dates in `America/Montevideo`; a 21:00 visit is
  00:00 UTC the next day and would land on the wrong column otherwise. The DTO
  ships pre-formatted time labels because `serializeActionResult` turns Dates
  into strings and `formatTime` has no fixed time zone.
- PDF: `buildSimplePdf` now takes optional `PdfImage[]`. The logo rides as an
  XObject with `/Filter [/ASCIIHexDecode /FlateDecode]`, so the document stays
  pure ASCII and the existing `xref` offset math keeps working. The PNG is
  flattened over white by `pnpm asset:logo` (140x166), which removes the need
  for `/SMask`. With no images the page dictionary is byte-identical to before.
- Cancelled and skipped visits stay visible in the panel but never reach the
  employee's PDF (`getDeliverableDays`).
- `visibleOccurrenceWhere` moved from `data/ops/visit-feed.ts` to
  `data/ops/shared.ts`; the generation horizon moved out of the server-only
  `job-occurrence-recurrence.ts` into `lib/ops/generation-horizon.ts` so the UI
  can disable the next-week control past it.
- PASS: `pnpm check:schedule` (new), `pnpm check:schedule-pdf` (new),
  `pnpm check:finance-pdf`, `check:finance`, `check:employee-accruals`,
  `check:profitability`, `check:occurrence-dialog`, `check:job-export`,
  TypeScript, full lint, harness, `prisma validate`, and `next build` with
  `/dashboard/schedules` registered.
- PASS: sample PDFs rendered to `tmp/pdfs/` and inspected for structure
  (xref offsets resolve to their objects, image `/Length` matches the encoded
  stream, the logo round-trips to `140*166*3` RGB bytes).
- NOT RUN: authenticated browser smoke. The panel needs a signed-in ADMIN
  session and the agent does not enter credentials. `/dashboard/schedules`
  answers 307 to `/auth/login` as expected while signed out.

## Next Step

- Sign in as ADMIN and smoke `/dashboard/schedules`: week navigation and the
  `?week=` sync, a future week showing generated visits, both PDF downloads
  opened in a viewer, and 390x844 with no horizontal overflow. Then close the
  feature.

## Paused Feature

- Feature 26 - `ops_visits_guided_workflow` remains `pending` without code
  changes. Its responsive visit shell, native status focus correction, and
  iPhone selector/date controls had passed focused checks, TypeScript, lint,
  harness, and Prisma validation; real mobile browser smoke remains pending.
