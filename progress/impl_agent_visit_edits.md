# Feature 27a - `agent_visit_edits`

Rama `feature/agent-visit-edits`, desde `main` en `35ee356`. Código en
`b184242` y `e678a1a`. Plan en `plans/bambu-agente-visitas.md` (local).

## Qué hace

El agente propone cambiar o eliminar una visita con el mismo contrato que
las propuestas de presupuestos: la tool guarda un `AgentProposal` PENDING y la
visita solo se escribe cuando el usuario confirma en la tarjeta.

- `proposeUpdateVisit`: horario (mover solo el inicio conserva la duración),
  equipo (lista completa), estado (cancelar es CANCELED, no se hizo es
  SKIPPED), horario real, notas y nombre del cronograma.
- `proposeArchiveVisit`: eliminar es archivar, como "Eliminar visita".
- `queryOperations` acepta `day` y cada fila de visitas trae `id`, `jobId`,
  `when` (con el día de la semana), horarios `AAAA-MM-DD HH:mm`,
  `employeeIds`, notas recortadas, `scheduleLabel` y `fromRule`.

## Piezas

- Puras: `lib/agent/visit-time.ts`, `visit-format.ts`, `visit-warnings.ts`,
  `visit-update-builder.ts`, `visit-proposals.ts`,
  `visit-proposal-preconditions.ts`; schemas `schemas/agent-visit-tools.ts`
  (entradas planas y nullable) y `schemas/agent-visit-proposals.ts` (patch
  estricto, sin regla ni `generatedStartAt`).
- Lecturas: `getAgentOccurrence`, `getAgentVisitState` y
  `getAgentVisitOverlaps` en `data/agent/occurrences.ts`;
  `data/agent/visit-targets.ts`.
- Tool: `lib/agent/tools/visits.ts` (`server-only`, sin db ni actions).
- Ejecución: `lib/agent/visit-proposal-execute.ts` (`server-only`, sin
  `"use server"`), que `runClaimed` llama antes de las precondiciones de
  presupuestos. Re-valida archivado, `updatedAt` y equipo guardado.
- Prompt: `VISIT_RULE` en General; `TOOL_POLICY` permite eliminar solo
  visitas. Las otras habilidades no tienen las tools.
- UI: textos de confirmar, nota de horarios de Montevideo, "Revisá Visitas"
  si el resultado es desconocido, e `invalidateOccurrenceScopes` al confirmar
  una de visitas.
- Migración aditiva `20261021150000_agent_visit_proposals` (`UPDATE_VISIT`,
  `ARCHIVE_VISIT`), aplicada en Neon con permiso. `CREATE_VISITS` y
  `summary.items` quedan para la 27b.

## Verificación

- `init.ps1`, `tsc`, lint, `pnpm build`.
- `check:agent-visits` (nuevo, en cuatro archivos; un cambio roto a
  propósito lo hace fallar), `check:agent-tools`, `check:agent-proposals`,
  `check:agent-sheet`, `check:agent-page`, `check:agent-pricing`,
  `check:agent-budget-editor`, `check:agent-cost-estimate`,
  `check:agent-attachments`, `check:ai-gateway`, `check:occurrence-generation`,
  `check:occurrence-dialog`, `check:visit-payroll-impact`, `check:visits-view`,
  `check:visit-day`, `check:schedule-move`.
- Smoke con Haiku 5.5 Alto contra Neon (sin OpenAI por pedido del usuario),
  con el trabajo "PRUEBA agente visitas" y 3 visitas de Nadia en enero de
  2027: buscar por día, mover (doble clic, una escritura), propuesta vieja
  FAILED, registrar horas con aviso de sueldos, cancelar, rechazar y
  confirmar eliminar. Todo archivado después. Costo menor a US$ 0,03.
- Encontrado en el smoke: el modelo calculaba mal el día de la semana; se
  arregló con `when` en las filas (`e678a1a`) y se volvió a probar.
- No verificado: que Visitas se actualice sin recargar después de confirmar
  (lo cubre la invalidación). La conversación de prueba quedó en el historial.
