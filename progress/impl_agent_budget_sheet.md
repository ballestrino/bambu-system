# Implementación - Feature 41 Sheet del agente en Presupuestos

Rama `feature/41-agent-budget-sheet`, encima de `feature/40-agent-proposals`.
Plan en `docs/agent-plan.md` (con "Ajustes al implementar la 41"), contrato
en `docs/agent.md` (sección "Sheet").

## Alcance

- `components/agent/**`: host del Sheet independiente de la pantalla,
  cabecera (título, contexto, historial, nueva conversación, modo y costo),
  chat (mensajes, chips de habilidad, composer, aviso de error), tarjetas por
  salida de tool (totales, propuesta, correo, finanzas, tendencia, sueldos,
  rentabilidad, precios oficiales y listas), historial con buscar, renombrar
  y borrar, y el diálogo "Costos de IA".
- Hooks: sesión (dueña de la instancia `Chat`), vista del chat, queries,
  mutaciones de conversación y de propuestas. Wrappers de acciones en
  `components/agent/actions/`.
- Acciones nuevas: `actions/agent/usage.ts` (costo de la conversación y del
  mes) y `actions/agent/settings.ts` (modo por defecto y modelo real de cada
  modo, con los overrides del entorno).
- Puros: `lib/agent/chat-request.ts` (cuerpo del pedido y lectura de
  errores), `form-context.ts` (valores del formulario sin campos inválidos),
  `usage-format.ts` (línea de uso), `proposal-outcome.ts` (resultado
  desconocido y las dos formas de confirmar) y `markdown-breaks.ts`.
- Puntos de entrada: `BudgetView.tsx` (presupuesto guardado) y
  `create-budget/Header.tsx` (formulario, leído al enviar).
- Retiro del chat viejo: `AIChat.tsx`, `AssistantMessageCopyMenu.tsx`,
  `app/api/ai-chat/stream/route.ts`, `data/ai-system-message.ts`,
  `actions/save-chat.ts` y `actions/upload-chat-image.ts`. También el mock
  `handleGenerateAI` de crear, que el trigger del Sheet nunca llamaba. La
  feature 7 queda `done` como reemplazada por la 41 y la 5 se acota a Resend y
  Cloudinary.
- Cambios chicos en el servidor de 39 y 40: `updatedAt` y `unknownOutcome` en
  el DTO de propuestas (y "resultado desconocido" en el prompt), `priced` por
  grupo en los costos, y la marca `stopped` en la respuesta guardada.
- `check:agent-sheet` nuevo (`scripts/check-agent-sheet.ts` y
  `agent-sheet-source-checks.ts`).

## Decisiones

- La instancia `Chat` del AI SDK vive en el host (`useAgentSession`), no en
  el contenido del Sheet: cerrar y reabrir no corta el stream ni pierde
  mensajes. Cambiar de conversación o salir de la página la detiene.
- Un solo transport para todas las conversaciones. Modo, habilidad y
  contexto viajan con cada `sendMessage` y `regenerate`, así no hacen falta
  refs (y el lint del compilador de React no las acepta en render).
- En un presupuesto guardado se retoma su última conversación. En crear se
  arranca una nueva: la última sin presupuesto puede ser de otro borrador.
- El formulario de crear se lee al enviar (`getValues`), no con `watch()` en
  cada tecla. Los campos inválidos no viajan y el servidor usa el valor por
  defecto, en vez de rechazar todo el turno con un 400.
- La habilidad marcada vive en la sesión: sigue al cerrar el Sheet o cambiar
  de conversación. Reintentar usa la habilidad del último mensaje y el modo
  actual.
- La tarjeta de propuesta usa el estado vivo (`listAgentProposals`, con
  polling mientras una se ejecuta). Sin estado vivo no ofrece confirmar.
  Confirmar invalida presupuestos, detalle y oficiales, y si cambió la
  dirección del presupuesto abierto redirige, como el formulario de edición.
- Una EXECUTING de más de 6 minutos (más que el máximo de una función en
  Vercel) se muestra como "resultado desconocido", en la tarjeta y en el
  prompt. El número de trabajos vinculados se presenta como "calculado al
  proponer".
- Con la sesión vencida, `proxy.ts` redirige al login y fetch sigue la
  redirección: el transport lo detecta y lo dice, en vez de parsear HTML.
- Los errores de la ruta (`{ error }`) y del stream se muestran tal cual; el
  HTML de un 504 o los errores internos del SDK, con un mensaje genérico.

## Hallazgos del smoke y correcciones

- Los overrides de `ol`, `th` y `td` del Markdown descartaban `start` y la
  alineación: un "2." salía "1.". Y los saltos simples se aplastaban (el
  correo copiado sí los respetaba). Corregido sin dependencia nueva.
- El chip de habilidad se reiniciaba al reabrir el Sheet: pasó a la sesión.
- Renombrar desde el menú de una fila dejaba el foco en `BODY`: el menú lo
  recuperaba al cerrarse. El diálogo se abre ahora cuando el menú terminó de
  cerrarse, y al cerrar devuelve el foco al botón de la fila.
- El selector de modo medía 32px en el teléfono (la variante `data-[size=sm]`
  del primitivo le ganaba a `h-11`).
- Meses con `capitalize` de CSS ("Setiembre De 2026") y "llamadas" donde se
  contaban turnos.
- Un uso sin precio se mostraba US$ 0,00 en el diálogo de costos: ahora dice
  "sin precio".
- Una respuesta detenida no registra consumo si se corta a mitad del primer
  paso: OpenAI informa el uso al terminar la respuesta y `onStepEnd` no llega.
  No se puede medir. Ahora queda marcada (`stopped`) y la línea lo dice
  ("Respuesta detenida · sin consumo medido"), también después de recargar.

## Verificación

- PASS: `check:agent-sheet` (nuevo) con prueba de mutación, 17 de 17: modo
  fuera del cuerpo, campos inválidos del formulario, errores crudos, umbral
  de resultado desconocido, confirmar sin `proposal`, `unknownOutcome` en el
  DTO y en el prompt, saltos de línea, formato de tokens, `start` de las
  listas, `priced` por grupo, stop del `Chat` al cambiar, marca `stopped`,
  opciones del reintento, formulario leído con `watch()`, sesión vencida e
  invalidación del detalle.
- PASS: regresiones `check:agent-tools`, `check:agent-proposals`,
  `check:ai-gateway`, `check:official-budgets`,
  `check:official-budget-workspace`, `check:mail-agent`,
  `check:mail-official-budgets` y `check:finance`.
- PASS: `pnpm exec tsc --noEmit`, `.\init.ps1` (harness, `prisma validate` y
  ESLint completo) y `pnpm exec next build` (37 rutas, sin
  `/api/ai-chat/stream`).
- PASS: smoke autenticado en el navegador integrado contra el `next dev` del
  puerto 3000, con OpenAI real (US$ 0,24 en total):
  - Crear: el Sheet ve el formulario sin guardar (nombre y 2 visitas), los
    importes coinciden con la vista previa, un cambio a 3 visitas se ve en el
    turno siguiente y "guardalo como nuevo" propone crear. Confirmado, el
    presupuesto quedó con los precios de la tarjeta.
  - Detalle: retoma o arranca conversación, margen al 40 % con tarjeta de
    totales, propuesta de guardar con antes y después y avisos, confirmada
    (la página se actualizó sola), otra al 35 % rechazada sin tocar nada.
  - Modo Alto: la línea dice Sol, el badge sube y el diálogo de costos lista
    el turno, el mes por modelo y modo y el top de conversaciones.
  - Emails: tarjeta con asunto, cuerpo e importes con fuente. Copiar como
    WhatsApp da texto sin Markdown con la nota de Literal E; como email,
    texto y HTML.
  - Consejos: tarjetas de finanzas, tendencia y sueldos con los mismos
    números que Finanzas de setiembre.
  - Cerrar y reabrir conserva la conversación. Recargar conserva historial,
    modo, propuestas (Confirmada y Rechazada) y costo. Stop en pleno stream.
  - Historial: búsqueda sin acentos, renombrar, abrir otra conversación,
    borrar una ajena y la activa (arranca una nueva) y el estado vacío.
  - Error: con un servidor de prueba sin `OPENAI_API_KEY` (puerto 3100,
    build de producción) el aviso dice "Falta configurar OPENAI_API_KEY",
    Reintentar no duplica el mensaje y el aviso se cierra. Un modelo que no
    existe da el mensaje genérico y el log trae la causa.
  - Sin precio: con `AI_MODEL_BAJO=gpt-4.1-mini` la línea dice "precio no
    configurado", el badge "+ sin precio" y el diálogo avisa y marca la fila.
  - 390x844: sin desborde horizontal y targets de 44px. Claro y oscuro.
    Consola sin errores ni advertencias en una carga limpia.
- Limpieza: conversaciones y presupuesto de prueba borrados desde la UI.
  Volvió a haber 200 presupuestos, 0 conversaciones y 0 propuestas. Quedan
  46 registros de consumo sin conversación (16 de hoy, US$ 0,24) y la
  auditoría (3 `proposal.create`, 2 `confirm`, 1 `reject`).
- NOT RUN: 403 para un usuario logueado que no es admin (no hay uno), una
  EXECUTING real de más de 6 minutos (cubierta por el check) y la redirección
  por cambio de dirección del presupuesto abierto (cubierta por lectura de
  código; ninguna propuesta del smoke cambió el nombre).

## Correcciones de la revisión (2026-09-22)

`progress/review_agent_budget_sheet.md` aprobó la feature con tres menores.

- 1: la fila del historial dice "+ sin precio" si la conversación tuvo uso
  sin precio (`unpricedEvents`, con `_count.costUsd` en
  `getConversationCostTotals`), como el badge.
- 2: `getDisplayStatus`, `canActOnProposal`, `hasRunningProposal` y
  `savedSlugRedirect` pasaron a `lib/agent/proposal-outcome.ts` y
  `check:agent-sheet` los prueba con entradas; el check de fuente afirma la
  instancia `Chat` del host en `useChat` y que confirmar relee las
  propuestas.
- 3: un link `//dominio` es externo (no va por `next/link`).
- PASS: `check:agent-sheet`, regresiones, `tsc`, `.\init.ps1` y
  `pnpm exec next build`. Mutaciones de los arreglos de la 41: 5 de 5.
- NOT RUN: el smoke en el navegador, por la misma falta de sesión.
