# Implementación - Feature 39 Núcleo del agente

Rama `feature/39-agent-core`, encima de `feature/38-ai-model-gateway`. Plan
en `docs/agent-plan.md` (con la sección "Ajustes al implementar"), contrato en
`docs/agent.md`.

## Alcance

- Prisma: `AgentConversation`, `AgentMessage`, `AgentUsageEvent` y
  `AgentAuditEvent`, con los enums `AgentMode`, `AgentMessageRole` y
  `AgentUsageKind`. La migración `20260918120000_agent_workspace` es aditiva:
  se generó offline con `prisma migrate diff` entre el schema anterior y el
  nuevo, y no toca `Chat` ni `Message`.
- `lib/agent/**`: perfil del negocio, meses en hora de Montevideo, catálogo
  de tools, habilidades (General, Presupuestos, Emails, Consejos), prompt,
  cálculos sobre las fórmulas del formulario, evidencia de precios, consumo,
  persistencia, título con `after()` y el turno (`turn.ts`, `run.ts`).
- 14 tools sin escrituras en `lib/agent/tools/**`, incluida `draftEmail`, que
  redacta con el modelo del modo y valida importes y Literal E.
- `data/agent/**`: conocimiento aprobado, visitas en solo lectura, historial y
  costos. `actions/agent/conversations.ts`: listar, abrir, renombrar, borrar y
  cambiar el modo.
- `POST /api/agent/chat` (admin, zod, stream de UIMessages), línea nueva en
  `docs/architecture.md`, `check:agent-tools`.

## Decisiones

- Todas las tools se registran y la habilidad elige las activas con
  `activeTools`: el historial puede traer partes de tools de otra habilidad.
- `AgentUsageEvent.conversationId` es SET NULL: borrar una conversación no
  borra el gasto. También guarda `cacheWriteTokens`.
- Las conversaciones son de cada usuario; el informe del mes es del equipo y
  muestra el título solo de las propias.
- El cliente manda solo el último mensaje; el historial (24) sale de la base.
  Reenviar un mensaje no lo duplica y descarta lo posterior (regenerar).
- `maxOutputTokens` 16.000 por paso (incluye razonamiento) y `maxDuration` 60.

## Hallazgos de la prueba real

- Con campos opcionales en las tools, el modelo completaba todos con valores
  inventados: mandó `personal_enabled: false` y dio el 40 % de "Edificio
  Guaraní" en $ 4.572,84 / $ 5.792,84 en vez de $ 5.498,65 / $ 6.718,65. Las
  entradas pasaron a campos obligatorios y nullable, como la tool del correo.
  El mismo pedido bajó de cinco tools y 31 s a una tool y 8 s, con el precio
  correcto. `changedFields` ahora compara contra la base.
- El contexto de un presupuesto guardado incluye el slug: sin él, el modelo
  inventaba uno para `getBudget`.
- Un 409 por mensaje ajeno se decide antes de tocar la conversación, y una
  respuesta cortada guarda igual su línea de consumo.

## Verificación

- PASS: `check:agent-tools` y `check:ai-gateway`, más las regresiones
  `check:finance`, `check:finance-trend`, `check:official-budgets` y
  `check:mail-agent`.
- PASS: `tsc`, `.\init.ps1` (harness, `prisma validate`, ESLint completo) y
  `pnpm exec next build` (38 rutas, con `/api/agent/chat`).
- PASS: prueba de contexto con una ruta temporal y modelo simulado: dentro de
  una tool, en pleno streaming, `headers()` y `auth()` funcionan.
- PASS: migración aplicada con confirmación del usuario en la rama de Neon
  `br-sparkling-night-acqea90i` (20/20). Lectura de control: tablas vacías, 17
  chats viejos intactos, FKs con las reglas previstas.
- PASS: prueba autenticada contra la ruta real con OpenAI, en Medio y Alto:
  - Presupuestos: margen al 40 % correcto en una tool.
  - Emails: borrador con las dos opciones, Literal E y los 6 importes con
    fuente, reconstruidos del turno anterior.
  - Consejos: el resumen de setiembre coincide con Finanzas ($ 39.444 cobrado,
    $ 328.454,98 proyectado, agosto $ 237.603 / $ 149.136 / $ 88.467), y los
    sueldos coinciden con Finanzas → Pagos (sugerido $ 120.858 con horas de
    agosto, aguinaldo $ 9.274,17, BPS $ 34.193,85 y el detalle por empleada).
  - Alto usó Sol; el precio objetivo dio $ 550 por hora exacto.
  - Formulario sin guardar: el cálculo parte de sus valores y un cambio se ve
    en el turno siguiente.
  - Corte a mitad de turno, regenerar, 409 por mensaje ajeno (sin crear
    conversación), 400 por pedido inválido y 307 al login sin sesión.
  - Títulos con `after()`, historial, costo por conversación, informe del mes y
    las acciones (renombrar, título vacío rechazado, modo, borrar).
- Las conversaciones de prueba se borraron con la acción de borrado. Quedan
  los 19 registros de consumo sin conversación (US$ 0,2034, gasto real) y 7
  eventos de auditoría.
- NOT RUN: 403 JSON para un usuario logueado que no es admin (no había uno) y
  el error sin `OPENAI_API_KEY` en el servidor (cubierto por el check).
- Turno más largo medido: 38,9 s (tendencia de 6 meses en Medio). Con
  `maxDuration` 60, un turno de Bajo con xhigh puede cortarse: conviene
  confirmar Fluid compute en Vercel y subirlo a 300.
