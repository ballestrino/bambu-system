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

## Cruces, Reasignacion Y Huecos

- Schema: `EmployeeAvailabilityRule`
  (`20260910190000_employee_availability_rules`, applied). Una regla `AVAILABLE`
  reemplaza la ventana por defecto (`08:00` a `18:00`) del dia y una
  `UNAVAILABLE` la recorta; `weekdays` vacio significa toda la semana. Las reglas
  se crean y se borran, no se editan, asi que solo llevan `createdById`.
- Toda la aritmetica vive en minutos desde la medianoche local
  (`lib/ops/minute-ranges.ts`). `ScheduleVisit` ahora expone `startMinute` y
  `endMinute`; una visita nocturna termina en 1500 en vez de volver a 60, asi que
  conserva su duracion al compararla.
- Cruces (`schedule-conflicts`): dos visitas de la misma empleada que se pisan se
  marcan en la tarjeta (borde ambar mas icono con el detalle), en la fila y en la
  barra. Las canceladas y omitidas no cruzan ni ocupan. El aviso no bloquea: a
  veces se solapa a proposito.
- El aviso de "fuera de disponibilidad" solo aparece si esa empleada tiene reglas
  cargadas. Sin reglas, la ventana por defecto es solo una convencion para buscar
  huecos y marcar cada visita temprana seria ruido.
- Reasignacion: soltar la tarjeta en la fila de otra empleada escribe dia, hora y
  equipo en una sola actualizacion (`buildScheduleMove`). Reemplaza a la empleada
  arrastrada y deja al resto del equipo; soltar en "Sin asignar" la saca.
- Durante el arrastre cada celda muestra sus huecos libres como destino: soltar
  ahi fija la hora de inicio y conserva la duracion. Soltar en el resto de la
  celda mantiene la hora original.
- `Buscar huecos` lista, por dia y empleada, los tramos libres que entran en la
  duracion elegida y crea la visita prefijada con ese dia, hora y empleada.
  `Disponibilidad` administra las reglas por empleada desde el mismo tablero.
- PASS: `pnpm check:schedule-availability` y `check:schedule-move` (nuevos),
  `check:schedule`, `check:schedule-pdf`, TypeScript, lint, harness,
  `prisma validate` y `pnpm build`.
- PASS: sonda transaccional contra la base real (`tmp/probe-availability.ts`,
  borrada al cerrar): crea una regla con `weekdays: [1, 3]`, la lee con su
  empleada incluida y revierte sin dejar filas.

## Blocked Verification

- NOT RUN: smoke autenticado del tablero con cruces, reasignacion, huecos y
  disponibilidad. El panel de navegador no tiene sesion y el `pnpm dev` del
  usuario se detuvo para poder regenerar el cliente de Prisma (el motor quedaba
  tomado por el proceso). Hay que **volver a levantar `pnpm dev`** y entrar a
  `/dashboard/calendar` para verificar.
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
