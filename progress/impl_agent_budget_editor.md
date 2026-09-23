# Implementación - Feature 43 Editor de presupuestos del agente

Rama `feature/43-agent-budget-editor`, encima de `feature/42-agent-page`.
Pedido del usuario el 2026-09-21: cuando el agente arma un presupuesto,
editarlo en el momento, guardarlo en el generador y ver el detalle en un
Sheet. Decidido con el usuario: se edita en el Sheet con el formulario del
generador, y aplica a los cálculos y a las propuestas de crear. Plan en
`docs/agent-plan.md` (sección "Feature 43" y sus ajustes), contrato en
`docs/agent.md` (sección "Editor de presupuestos").

## Alcance

- Tools: `calculateBudget`, `solveForTargetPrice` y `proposeCreateBudget`
  devuelven `values` (el `BudgetFormValues` completo) y `toModelOutput:
  hideFromModel("values")` se lo saca al modelo (`lib/agent/tool-result.ts`).
- DTO de propuestas: `values` vivos de las de crear (`payload` en
  `proposalSelect`). Las precondiciones de confirmar pasaron a
  `lib/agent/proposal-preconditions.ts` (reexportadas).
- Guardar: `actions/agent/save-budget.ts` (`saveAgentBudget`),
  `data/agent/tool-calls.ts` (la llamada a tool en la conversación del
  usuario), `reviseAgentProposal` en `lib/agent/proposal-store.ts` (auditoría
  `proposal.revise`) y `confirmAgentProposal` sin cambios.
- Schemas: `agentBudgetEditorSchema` (formulario del editor) y
  `agentSaveBudgetSchema` (entrada de guardar) en `schemas/agent-proposals.ts`.
- `lib/agent/budget-draft.ts`: qué tools se guardan desde el chat, qué
  estados se revisan o bloquean, y `valuesFromInputs` para salidas viejas.
- UI: `components/agent/budget-editor/**` (estado del editor y borradores,
  Sheet con pestañas Detalle y Editar, detalle con `BudgetDetails`, pie con
  finales y guardar), `cards/agent-budget-actions.tsx`, la tarjeta de cálculo
  y la de propuesta (resumen vivo), el `toolCallId` hasta las tarjetas,
  `use-agent-budget-save.ts` y `saveBudgetAction` con `BudgetFieldError`.
- `check:agent-budget-editor` nuevo.

## Decisiones

- Guardar pasa por una propuesta de la llamada a tool, no por
  `createBudget` directo: queda auditado, se escribe una sola vez aunque se
  repita (único por conversación y llamada), la tarjeta recuerda que se
  guardó después de recargar, y el agente lo ve en el bloque de propuestas.
  Probado: el turno siguiente abrió el presupuesto guardado por nombre.
- Una propuesta PENDING, REJECTED, EXPIRED o FAILED se revisa con los valores
  editados y vuelve a PENDING antes de confirmar; CONFIRMED y EXECUTING no se
  tocan (el update es condicional) y el editor es de solo lectura.
- Un cálculo se guarda siempre como presupuesto nuevo. Si partió de uno
  guardado, el nombre arranca vacío y el editor lo avisa; guardar cambios en
  ese sigue siendo pedírselo al agente.
- Los borradores viven en una ref del chat, sin re-render por tecla, y se
  publican al cerrar el editor para el aviso de la tarjeta. Se pierden al
  recargar, al cambiar de conversación o al cerrar el Sheet de Presupuestos.

## Hallazgos del smoke y correcciones

- El detalle tenía dos barras de scroll: las tarjetas de la página traen
  alto máximo y scroll propios. Se neutralizan dentro del editor.
- Cerrar el editor encima del Sheet de Presupuestos dejaba el foco en
  `BODY`: vuelve al botón que lo abrió (`onCloseAutoFocus`).
- Después de recargar, "Ver detalle" de un cálculo guardado mostraba los
  valores del agente (4 h) y no los guardados (3 h): el editor parte de los
  `values` de la propuesta cuando la hay.
- En el teléfono el cierre medía 16 px y las pestañas 37: ahora 44.

## Verificación

- PASS: `check:agent-budget-editor` (nuevo) con prueba de mutación, 20 de 20
  (tres se agregaron al check después de una primera corrida que no las
  detectaba: empleadas con decimales, guardar sin la llamada a tool y la
  línea del resumen vivo).
- PASS: regresiones `check:agent-page`, `check:agent-sheet`,
  `check:agent-tools`, `check:agent-proposals`, `check:ai-gateway`,
  `check:official-budgets` y `check:mail-agent`.
- PASS: `pnpm exec tsc --noEmit`, `.\init.ps1` (harness, `prisma validate` y
  ESLint completo, sin advertencias) y `pnpm exec next build`.
- PASS: smoke autenticado en el navegador integrado contra el `next dev` del
  puerto 3000, con OpenAI real (unos US$ 0,03):
  - "Armá un presupuesto de limpieza de oficina, 2 veces por semana": la
    tarjeta de cálculo trae Ver detalle y Editar. El detalle coincide con la
    tarjeta (sin productos $ 17.349,84, con productos $ 18.272,16).
  - Editar: 3 horas por visita recalcula al instante ($ 13.111,73 y
    $ 14.034,05, iguales a `runBudgetCalculation`). Cerrar deja "Tenés
    cambios sin guardar." y reabrir conserva las 3 horas.
  - Guardar sin nombre marca el campo; con "Edificio Guaraní durazno y
    jackson" el servidor dice que la dirección está tomada, sin escribir.
  - Guardar como "Prueba agente 43 cálculo": aviso, editor de solo lectura
    con Abrir y Editar en el generador, tarjeta "Guardado en el generador".
    El turno siguiente el agente lo abrió por nombre: 3 h por visita y los
    mismos finales.
  - Propuesta de crear "Prueba agente 43 propuesta": Editar, 2 empleadas y
    guardar la confirmó con el cambio; la tarjeta muestra el resumen nuevo
    ($ 34.302,30 y $ 35.224,62).
  - En el Sheet de Edificio Guaraní, un cálculo con margen 40 % abre el
    editor encima del agente, con el aviso de presupuesto nuevo y el nombre
    vacío; cerrarlo vuelve al agente con el foco en Editar.
  - Recargar conserva el estado guardado de las dos tarjetas. 390x844 sin
    desborde, claro y oscuro, consola sin errores ni advertencias.
- Datos: con permiso del usuario quedaron dos presupuestos de prueba en la
  base ("Prueba agente 43 cálculo" y "Prueba agente 43 propuesta") y sus
  propuestas confirmadas, para borrar desde el generador. También la
  conversación "Presupuesto de limpieza de oficina 2 veces por semana" y dos
  turnos más en la de Edificio Guaraní.
- NOT RUN: una propuesta que falla al ejecutarse y se revisa (cubierta por el
  check y la lectura de código) y dos guardados en paralelo de la misma
  tarjeta (el único por llamada y el claim de confirmar lo cierran).

## Correcciones de la revisión (2026-09-22)

`progress/review_agent_budget_editor.md` pidió cambios con tres bloqueantes.
Van encima de la 44 (misma rama), en el `fix(agent)` de 41-44.

- Bloqueante 1 (aporte en 0 %): la fuente `edited` ya no pasa por
  `applyBudgetChanges` (`asEdited` en `lib/agent/agent-pricing.ts`): se guarda
  como se tipeó, como en el generador, y solo se recalcula el precio final.
  Un aporte habilitado en 0 o vacío queda en 0 y lo guardado es lo del
  editor.
- Bloqueante 2 (borrador sobre lo guardado): guardado o guardándose, el
  editor abre con `proposal.values` (`resolveEditorValues`); si se guarda con
  el editor abierto, `form.reset` a lo guardado y descarta el borrador. En una
  propuesta pendiente con borrador, la tarjeta avisa que Confirmar la guarda
  sin esos cambios (solo en pendientes: vencida o rechazada no tiene
  Confirmar).
- Bloqueante 3 (resumen viejo para el modelo): `withLiveProposals` pone
  también `summary` y `grounding` vivos; el bloque de propuestas lleva los
  finales guardados de una confirmada con cálculo, y `getConfirmedAmounts`
  los suma a la evidencia (cubre el cálculo guardado desde el editor, que no
  tiene salida `propose*`).
- Menores: el borrador se anota en cada cambio mientras se puede guardar y
  deja de serlo si vuelve a los valores de la tarjeta (`isSameBudgetDraft`);
  Guardar espera mientras el agente responde (`waiting`); una EXECUTING vieja
  dice "resultado desconocido" en la tarjeta del cálculo y en el editor; los
  demás campos del generador validan en castellano
  (`agentBudgetEditorErrors`, pasado al resolver); los checks de fuente
  normalizan CRLF; `findSavableBudgetCall` llama a `requireAdminSession`; los
  `values` de una propuesta repetida salen de la fila (`readCreateValues`); el
  hook pasó a `components/agent/hooks/use-budget-editor.ts`, y
  `docs/agent.md` lista `check:agent-budget-editor`.
- Queda como estaba: `findSavableBudgetCall` lee las partes de todos los
  mensajes del asistente de la conversación (sin límite).
- PASS: `check:agent-budget-editor` (aportes en 0 y vacíos, qué muestra el
  editor según el estado, borrador que vuelve, mensajes en castellano),
  `check:agent-proposals` (resumen e importes vivos, finales guardados en el
  bloque), las regresiones del agente, oficiales y mail, `tsc`, `.\init.ps1`
  (harness, `prisma validate` y ESLint) y `pnpm exec next build` (38 rutas).
- PASS: prueba de mutación de los arreglos de la 43, 15 de 15 detectadas.
- NOT RUN: el smoke en el navegador. El navegador integrado no tiene sesión
  (redirige al login) y entrar la contraseña le toca al usuario. Falta: un
  aporte vacío guardado, "Confirmar" con un borrador y después "Ver detalle",
  y el turno siguiente a guardar una propuesta editada (con OpenAI).
