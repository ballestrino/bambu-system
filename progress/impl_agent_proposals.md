# Implementación - Feature 40 Propuestas del agente

Rama `feature/40-agent-proposals`, encima de `feature/39-agent-core`. Plan en
`docs/agent-plan.md` (con "Ajustes al implementar la 40"), contrato en
`docs/agent.md` (sección "Propuestas").

## Alcance

- Prisma: enums `AgentProposalKind` y `AgentProposalStatus`, modelo
  `AgentProposal` y relaciones inversas en `User` y `AgentConversation`. La
  migración `20260918180000_agent_proposals` se generó offline con `prisma
  migrate diff` y es aditiva: solo crea la tabla, sus enums, índices y FKs.
- `lib/agent/proposals.ts` (puro): tipos, estados, vencimiento a 24 horas,
  estado vivo, precondiciones al confirmar, respuestas de confirmar y rechazar.
- `lib/agent/proposal-builders.ts` y `lib/agent/stored-budget-proposals.ts`
  (puros): crear y guardar cambios (con la misma base y los mismos `changes`
  que `calculateBudget`), duplicar y publicar. `lib/agent/proposal-summary.ts`:
  diff por campo, precios guardados y avisos.
- `schemas/agent-proposals.ts`: payloads por tipo, re-validados al confirmar.
  `schemas/agent-tools.ts`: entradas de las cuatro tools (obligatorias y
  nullable, como las demás).
- `lib/agent/tools/proposals.ts`: `proposeCreateBudget`,
  `proposeUpdateBudget`, `proposeDuplicateBudget` y
  `proposePublishOfficialBudget`. Guardan la propuesta PENDING con
  `lib/agent/proposal-store.ts` y no llaman a ninguna acción de presupuestos.
- `actions/agent/confirm-proposal.ts`, `reject-proposal.ts` y `proposals.ts`
  (listar con el estado vivo). Lecturas en `data/agent/budgets.ts` y
  `data/agent/proposals.ts`.
- Prompt con "Propuestas de esta conversación", política de tools nueva,
  habilidad Presupuestos con las cuatro tools y General con una línea más.
  `lib/agent/proposal-context.ts`: el bloque del prompt y el estado vivo de
  cada propuesta en el historial que ve el modelo.
- `lib/budget-slug.ts`: la regla de slug de `createBudget`, que ahora usan
  `createBudget`, `duplicateBudget` y las propuestas.
- `check:agent-proposals`, docs y comentario del check de la 39.

## Decisiones

- `toolCallId` único por conversación, `actorId` en cascada, `baseUpdatedAt`
  y `officialBudgetId` en los payloads, `changes` en el resumen: motivos en
  "Ajustes al implementar la 40" del plan.
- El claim es `updateMany` de `PENDING` sin vencer a `EXECUTING`: una sola
  confirmación ejecuta y las demás devuelven el estado guardado.
- Una vencida no pasa nunca a confirmada ni a rechazada: al intentarlo se
  registra `EXPIRED`. Las lecturas la muestran vencida sin escribir.
- Reintentar o regenerar vence las pendientes de la respuesta descartada.
- Un corte del servidor en plena ejecución deja `EXECUTING`: no se reintenta
  solo porque no se sabe si la escritura llegó.

## Hallazgo de la prueba real

- Con solo el bloque del prompt, a "¿qué quedó guardado y qué sigue
  pendiente?" el modelo dio por pendientes el margen al 40 % (confirmado), el
  35 % (falló), la publicación (rechazada) y las 3 visitas (vencida). La
  salida guardada de cada tool dice PENDING para siempre, y las cuatro
  propuestas de guardar cambios tenían el mismo título en el bloque.
- Corrección: `withLiveProposals` (`lib/agent/proposal-context.ts`) pone el
  estado vivo en la salida de cada `propose*` del historial que se manda al
  modelo (la base no cambia), y cada línea del bloque dice qué cambia
  ("Margen del servicio 45 → 40"). La misma pregunta pasó a responderse bien
  y sin tools.

## Verificación

- PASS: `check:agent-proposals` (nuevo) y prueba de mutación, 9 de 9: sacar
  `status: "PENDING"` del claim, cambiar el TTL, sacar las categorías de la
  lectura, regenerar siempre el slug, no comparar el vínculo oficial, no
  vencer al regenerar, no poner el estado vivo en el historial, no describir
  los cambios en el bloque y no usar el historial vivo en el turno.
- PASS: regresiones `check:agent-tools`, `check:ai-gateway`,
  `check:official-budgets`, `check:official-budget-workspace`,
  `check:mail-agent`, `check:mail-official-budgets` y `check:finance`.
- PASS: `pnpm exec tsc --noEmit`, `.\init.ps1` (harness, `prisma validate`,
  ESLint completo) y `pnpm exec next build` (38 rutas).
- PASS: migración aplicada con confirmación del usuario en la base del `.env`
  (Neon, 21 de 21). Lectura de control: tabla vacía, las dos FKs en cascada y
  el único `(conversationId, toolCallId)`.
- PASS: prueba autenticada con OpenAI contra la ruta real (servidor en
  `127.0.0.1:3100`; confirmar y rechazar por una ruta temporal ya borrada):
  - Crear desde el formulario sin guardar (Medio): la tool se llamó con todo
    en `null` y tomó el nombre del formulario. Después del turno seguía
    habiendo 200 presupuestos y una propuesta PENDING a 24 horas.
  - Confirmar creó uno solo, con los precios de la tarjeta ($ 17.747,23 y
    $ 19.591,87). Repetir la confirmación devolvió el mismo resultado sin
    escribir ni auditar de nuevo.
  - "Ajustá el margen a 40 % y guardalo": `calculateBudget` y
    `proposeUpdateBudget` con los mismos `changes`; antes $ 17.747,23 y
    después $ 17.135,26, con el aviso de opciones recreadas. Confirmada, la
    base quedó en 40 % con los precios de la tarjeta.
  - La alternativa del 35 %, confirmada después, falló con "El presupuesto
    cambió desde la propuesta" y no tocó nada.
  - Duplicar confirmado dos veces en paralelo: una ejecutó y la otra vio
    "se está ejecutando"; quedó una sola copia.
  - Publicar como oficial: rechazada dos veces con el mismo resultado,
    confirmar la rechazada dio error y no se creó ningún oficial (16).
  - Vencida (con `expiresAt` movido al pasado en esa fila): la lista ya la
    mostraba vencida sin escribir; confirmar la registró EXPIRED.
  - Regenerar: la propuesta de la respuesta descartada quedó EXPIRED con el
    motivo y la nueva, PENDING.
  - Auditoría: 8 `create`, 3 `confirm`, 1 `fail`, 1 `reject` y 2 `expire`.
- Limpieza: presupuestos y conversaciones de prueba borrados con las acciones
  existentes. Volvió a haber 200 presupuestos, 16 oficiales y 0 propuestas.
  Quedan los 15 eventos de auditoría y los 11 registros de consumo sin
  conversación (US$ 0,0635), como se esperaba.
- NOT RUN: 403 para un usuario logueado que no es admin (no hay uno) y el
  corte del servidor en plena ejecución (queda EXECUTING, documentado).
