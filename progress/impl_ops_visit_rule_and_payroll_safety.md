# Feature 27c - `ops_visit_rule_and_payroll_safety`

Rama `feature/ops-visit-safety`, desde `main` en `a513772`. Código en
`98b0f33`. Va antes de la 27a y la 27b (el agente con visitas): el plan está
en `plans/bambu-agente-visitas.md` (local).

## Riesgo 1: una visita de regla movida se regeneraba

`findMissingStarts` buscaba las visitas del trabajo por `scheduledStartAt`.
Una visita movida, separada o editada fuera de su horario dejaba libre el
inicio original y "Generar visitas" creaba otra ahí. Lo confirmó el caso de
Oficina Lazarina del 18/9: la visita de las 11:00 (generada el 3/8, movida y
realizada) y otra de las 09:00 que la misma regla generó el 10/9.

- `JobOccurrence.generatedStartAt` (migración aditiva
  `20261021120000_occurrence_generated_start`, con índice
  `jobId, generatedStartAt`). Solo lo escribe la generación; los schemas de
  crear y editar no lo aceptan y `updateJobOccurrence`, `detachJobOccurrence`
  y el patch no lo tocan.
- `lib/ops/generation-starts.ts`: `getMissingStarts` da un inicio por ocupado
  si una visita del trabajo, archivada o no, lo tiene en `scheduledStartAt` o
  en `generatedStartAt`. `findMissingStarts` busca por los dos.
- `scripts/backfill-generated-starts.ts`: vista previa por defecto;
  `--apply --expect=<n>` copia el inicio con SQL (sin tocar `updatedAt` ni
  `updatedById`) en una transacción que se revierte si la cantidad difiere.

## Riesgo 2: eliminar una visita realizada restaba sueldos sin aviso

- `components/ops/visit-payroll-impact.ts`: `getVisitPayrollImpact` (DONE con
  equipo, mes trabajado en Montevideo, desde agosto de 2026) y
  `formatVisitPayrollWarning`.
- `data/ops/visit-payroll-status.ts` + `getPaidEmployeeIdsAction` +
  `useVisitPaidEmployees`: empleadas con pagos RECORDED en el mes de pago
  (mes trabajado + 1), con la clave bajo `employeePayments`.
- `VisitPayrollWarning` va dentro de la confirmación de "Eliminar visita"
  (`DeleteDialog` acepta `children`). No bloquea: la acción no cambió.

## Producción (con permiso del usuario, 2026-10-21)

- `prisma migrate deploy`: migración aplicada, `migrate status` al día.
- Backfill: de 1613 visitas de regla, 1338 completadas (745 sin tocar y 593
  tocadas en un inicio de su regla). 275 quedaron en null (273 movidas o con
  la regla cambiada, 149 archivadas; 2 separadas), todas pasadas.
  Verificación: 0 con fecha distinta de `scheduledStartAt`, ninguna con
  `updatedAt` nuevo.
- Posibles duplicados: Lazarina 18/9 (el bug), Formula Producciones 24/9 (una
  manual y una de regla) y Godoy 2/10 (dos reglas). El usuario decidió no
  tocarlos.

## Verificación

- `init.ps1`, `tsc`, lint, `pnpm build`.
- `check:occurrence-generation` (con `occurrence-generation-start-checks.ts`)
  y `check:visit-payroll-impact` (nuevo), más `check:schedule-move`,
  `check:visit-day`, `check:visits-view`, `check:occurrence-dialog`,
  `check:schedule`, `check:schedule-availability`, `check:employee-accruals`,
  `check:finance` y `check:ops-locale`.
- Smoke en el panel del navegador a 1440x900: visita "PRUEBA aviso sueldos"
  (Echeverriarza, Nadia, 21/10 20:00–21:00, sin regla) creada, marcada
  Realizada y eliminada. El aviso dijo "se restan 1 hs y el transporte a
  Nadia en los sueldos de octubre." Quedó archivada
  (`cmvi7gi4p00040h98fggi2mck`). Sin errores de consola ni del servidor.
- No se probó la segunda línea del aviso (mes con pagos) en el navegador:
  la cubre el check.
