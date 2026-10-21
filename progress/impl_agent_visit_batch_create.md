# Feature 27b - `agent_visit_batch_create`

Rama `feature/agent-visit-create`, desde `main` en `314ebdc`. Código en
`cd23594`; `main` (con la 28) mergeada en `0cf3d5b`. Plan en
`plans/bambu-agente-visitas.md` (local).

## Qué hace

El agente propone agendar hasta 20 visitas de un trabajo con un solo
Confirmar, con el mismo contrato que las demás propuestas: la tool guarda un
`AgentProposal` PENDING y las visitas se escriben al confirmar.

- `proposeCreateVisits`: `jobId`, días en `dates` o en `repeatFrom`,
  `repeatTo` y `repeatWeekdays` (1 lunes … 7 domingo), `startTime`,
  `endTime`, `employeeIds` (`null` = el equipo asignado al trabajo), `notes`
  y `scheduleLabel`. El servidor expande la repetición (`expandVisitDates`).
- Rechazos: más de 20, trabajo archivado, ningún día, fin ≤ inicio, equipo del
  trabajo que cambia en el rango, empleadas que no existen o archivadas, y
  días con una visita del trabajo que ya empieza a esa hora.
- Avisos: trabajo no activo, sin equipo, empleadas inactivas, cruces y
  visitas pasadas. La tarjeta lista cada visita en `summary.items`.
- Confirmar re-valida (`checkCreateVisitsPreconditions`) y llama a
  `createJobOccurrences` (`actions/ops/job-occurrence-batch.ts`): todas o
  ninguna en una transacción en arreglo, SCHEDULED, sin regla ni
  `generatedStartAt`.

## Piezas

- Ops: `schemas/ops/job-occurrence-batch.ts`, `createOccurrencesWithEmployees`
  en `lib/ops/job-occurrence-persistence.ts`, la acción nueva.
- Agente: `lib/agent/visit-create-builder.ts` (puro), `visit-time.ts`
  (fechas), `visit-proposal-preconditions.ts`, `visit-proposal-execute.ts`,
  `tools/visits.ts`, lecturas `getAgentVisitJob`, `getAgentJobTakenStarts` y
  `getAgentTeamVisits`; `components/agent/cards/agent-proposal-items.tsx`.
- Migración aditiva `20261021180000_agent_visit_batch_create`
  (`CREATE_VISITS`), aplicada en Neon el 2026-10-21 con permiso.

## Verificación

- `init.ps1` con `HARNESS_FULL=1`, `tsc`, lint, build.
- `check:agent-visits` con `scripts/agent-visit-create-checks.ts`, y
  `check:agent-tools`, `check:agent-proposals`, `check:agent-sheet`,
  `check:agent-page`, `check:agent-pricing`, `check:agent-budget-editor`,
  `check:occurrence-generation`, `check:occurrence-dialog`,
  `check:visits-view`, `check:visit-payroll-impact`.
- Smoke con Haiku 5.5 Alto contra Neon, en el panel del navegador, con el
  trabajo nuevo "PRUEBA agente visitas 27b" y Nadia:
  - "los martes de enero de 2027 de 9 a 13" → una tarjeta con 5, 12, 19 y 26
    (`repeatWeekdays [2]`, el modelo no calculó fechas); doble clic en
    Confirmar escribió 4 visitas SCHEDULED, sueltas, sin `generatedStartAt`;
    aparecieron en Visitas sin recargar.
  - "todos los días de enero" → el modelo lo partió solo en 20 + 11
    (rechazadas); pedido "en una sola propuesta", se negó sin llamar a la
    tool, así que el rechazo de más de 20 del servidor queda probado solo por
    el check.
  - repetir los martes → `already_scheduled` con los cuatro días.
  - Costo menor a US$ 0,02.
- Sin OpenAI, por decisión del usuario.
- Limpieza: las 4 visitas eliminadas desde Visitas y el trabajo archivado. El
  trabajo viejo "PRUEBA agente visitas" no se puede desarchivar desde la app
  (editar el estado no borra `archivedAt`): se pasó a Activo, quedó con
  fechas de enero de 2027 y se volvió a Archivado. Consulta final: 0 visitas
  de prueba ni de enero de 2027 sin archivar. La conversación de prueba
  queda en el historial del agente.
