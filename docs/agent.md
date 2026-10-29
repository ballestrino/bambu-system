# Agente de Bambú

Contrato de producto y entorno del agente. El plan original está en
`docs/agent-plan.md`, con la numeración de features anterior al 2026-09-24;
este documento describe lo que ya existe y se actualiza con cada feature.

## Estado

- Modelos: capa `lib/ai/**` con modos, proveedores perezosos y costos.
- Núcleo: `lib/agent/**`, habilidades, tools de lectura y cálculo,
  `draftEmail`, persistencia `Agent*` y la ruta `/api/agent/chat`.
- Propuestas: el agente prepara crear, guardar, duplicar o publicar como
  oficial un presupuesto, o crear, cambiar o eliminar visitas, y solo se
  escribe cuando el usuario confirma.
- Sheet: el agente en el Sheet de Presupuestos (detalle y crear), con modos,
  habilidades, tarjetas, propuestas, historial y costos. Reemplazó al chat
  viejo (`AIChat`, `/api/ai-chat/stream`, `save-chat`), que se borró.
- Página: `/dashboard/agent` ("Agente" en el sidebar), el mismo agente a
  ancho completo con todas las conversaciones. Comparte las conversaciones
  con el Sheet, que abre la suya en la página.
- Editor de presupuestos: los presupuestos que arma el agente (cálculos y
  propuestas de crear) se ven en detalle, se editan con el formulario del
  generador en un Sheet y se guardan en el generador desde el chat.
- Reglas de precio: el precio sin IVA sube al próximo múltiplo de $ 100, los
  productos van en múltiplos de $ 500, antes de calcular uno nuevo se busca
  uno igual, y Emails responde un pedido de presupuesto con precio.
- Modos en gpt-6: Medio es `gpt-6-luna` con `xhigh` (razona mejor que
  `gpt-5.6-terra` con `high` y cuesta menos) y Alto es `gpt-6-sol` con
  `medium`, también más barato que Terra. Bajo se retiró.
- Formato de precio y empleadas: los precios se escriben "$ 54.100 + IVA" y,
  si no dicen cuántas empleadas, el agente asume 1 sin preguntar.
- Imágenes y dictado: el "+" del composer adjunta hasta 7 imágenes por
  mensaje y el micrófono dicta con `gpt-transcribe` (ver "Imágenes y
  dictado").
- Claude (feature 25): Haiku 5.5 (Alto y Extra alto, el recomendado y por
  defecto), Sonnet 5.5 (Alto) y Opus 5.5 (Medio) junto a los de OpenAI. El
  composer elige modelo y después esfuerzo, con el costo por mensaje de cada
  uno (ver "Modos" y "Claude").
- Correo (feature 32): el agente lee en vivo las casillas de Hostinger
  contacto@ y comercial@, sugiere qué hacer, prepara una respuesta por correo,
  agrupa los pedidos de presupuesto idénticos y sugiere el precio de cada
  grupo (ver "Correo"). Se quitaron la vista `/dashboard/email` y el agente de
  correo viejo (`lib/mail-agent/**`, su cron y sus acciones); las tablas
  `Mail*` siguen en la base, sin uso desde la 34.
- Autocontinuado (feature 32): si un tramo del turno llega al tope de pasos,
  se corta por largo o termina sin texto, el turno sigue solo, hasta 3 veces
  (ver "Autocontinuado").
- Memoria (feature 34): el agente propone recordar un dato o una preferencia,
  un admin lo confirma en la tarjeta y entra al prompt de todos los turnos.
  Se edita, se vence y se elimina en `/dashboard/memory` (ver "Memoria").
- Instrucciones del equipo (feature 35): el agente propone agregar, cambiar o
  quitar una regla de cómo trabaja, un admin confirma el antes y el después y
  queda una versión nueva; las reglas fijas no se tocan. Versiones y
  restaurar en `/dashboard/instructions` (ver "Instrucciones del equipo").

## Núcleo

- `POST /api/agent/chat` (solo admin, 403 JSON): `{ id, message, mode, skill,
  context?, trigger?, messageId? }` validado con `schemas/agent.ts`. El
  cliente manda solo el último mensaje; el historial (24 mensajes) sale de
  la base. `context` es `{ kind: "saved", budgetId }` o `{ kind: "form",
  values }`.
- Una conversación es de un usuario: toda lectura y escritura filtra por
  `userId`. Reenviar un mensaje (reintento o regenerar) no lo duplica y borra
  lo que vino después. Un id que ya existe con otro rol u otro texto da 409:
  no se reinterpreta.
- `AgentMessage.parts` guarda el `UIMessage` completo (texto, razonamiento y
  tools). `AgentUsageEvent` guarda tokens y costo por tipo (TURN, SKILL,
  TITLE) y modelo; sobrevive al borrado de la conversación (SET NULL) para que
  el gasto del mes no cambie.
- El título sale del primer mensaje y después lo mejora Luna con `after()`,
  mientras la conversación no tenga respuesta (también al reintentar un
  primer turno que falló) y solo si el título sigue siendo el provisorio del
  primer mensaje (`needsModelTitle`, `lib/agent/conversation-title-rules.ts`).
  Un renombrado nunca se pisa, ni durante el turno ni al regenerar la primera
  respuesta.
- Habilidades en `lib/agent/skills/**`: General (todas las tools),
  Presupuestos, Emails y Consejos. Todas las tools quedan registradas y la
  habilidad elige las activas (`activeTools`), así el historial puede traer
  tools de otra habilidad.
- Tools en `lib/agent/tools/**`, sin escrituras: `getBusinessProfile`,
  `searchOfficialBudgets`, `listOfficialBudgets`, `getOfficialBudget`,
  `searchBudgets`, `findMatchingBudgets` (reglas de precio), `getBudget`,
  `calculateBudget`, `solveForTargetPrice`,
  `getFinancialSnapshot`, `getFinancialTrend`, `getJobProfitability`,
  `getPayrollSummary`, `queryOperations` (visitas del mes o de un `day`),
  `listEmails`, `readEmail` y `groupBudgetRequests` (ver "Correo") y
  `draftEmail`. Devuelven
  `{ ok, data } | { ok: false, error }` con `card` para la UI; `runTool` pasa
  cada salida por `toPlainJson`, así nunca llega un `Decimal` ni un `Date`.
- Las entradas de las tools son campos obligatorios y nullable (`null` = sin
  dato o sin cambio): con campos opcionales el modelo inventaba valores. Un
  `null` se pasa como `undefined` antes de llamar a una lectura de `data/`,
  que valida con zod.
- Las visitas se leen con `data/agent/occurrences.ts` (`getAgentOccurrences`
  y los lectores de las propuestas de visitas): solo leen, las visitas se
  generan a mano.
- Regla de precios: solo se citan importes de una fuente de la conversación
  (precio oficial exact, presupuesto o cálculo). Las tools que dan importes
  los declaran en `grounding` y se reconstruyen de las partes guardadas.
  `draftEmail` redacta con el modelo del modo y falla con `ungrounded_price`,
  `price_mismatch` o `missing_literal_e`, y devuelve como fuentes solo los
  oficiales con algún importe citado en el borrador. No envía nada.
- IVA: `calculateBudgetTotals` toma un IVA 0 como 22 (`|| 22`). Por eso el
  IVA de los `changes` es mayor que 0 ("sin IVA" son los importes sin IVA del
  cálculo, por Literal E) y toda base, guardada o del formulario, parte del
  IVA efectivo (`withEffectiveIva`): insumos, totales y propuestas coinciden.
- La memoria del equipo (`AgentMemory`, ver "Memoria") entra al prompt
  después de las reglas fijas. Reemplazó la lectura de `MailMemory`.
- `maxDuration` es 300 s desde el 2026-09-23, el máximo de Hobby con Fluid
  compute (activo en el proyecto). Con 60 s, en 12 horas de producción se
  cortó 1 de cada 3 turnos (20 llamadas, 33 % de timeouts). Cada turno usa
  unos 2,8 s de Active CPU (P75): el resto es esperar a OpenAI, que Fluid no
  cobra como CPU. El consumo se guarda en `onEnd`: si Vercel corta la función
  a los 300 s, el de ese turno se pierde.
- Una respuesta detenida (Stop o pedido cortado) se guarda con lo que llegó y
  la marca `stopped`. Si se corta a mitad de un paso, ese paso no informa
  consumo (OpenAI lo manda al terminar la respuesta) y no se registra: se
  cuentan solo los pasos que terminaron.
- El top 10 del informe del mes ordena por uso con precio; el uso sin precio
  lo cuenta `unpricedEvents`.

## Propuestas

Proponer y confirmar: ninguna tool escribe presupuestos durante el turno.

| Tool | Tipo | Al confirmar ejecuta |
| --- | --- | --- |
| `proposeCreateBudget` | `CREATE_BUDGET` | `createBudget(values)` |
| `proposeUpdateBudget` | `UPDATE_BUDGET` | `updateBudget(budgetId, newSlug, values, { expectedUpdatedAt })` |
| `proposeDuplicateBudget` | `DUPLICATE_BUDGET` | `duplicateBudget(budgetId)` |
| `proposePublishOfficialBudget` | `PUBLISH_OFFICIAL_BUDGET` | `publishOfficialBudget({ sourceBudgetId })` |

- Crear y guardar parten de la misma base y los mismos `changes` que
  `calculateBudget`: "calculalo y guardalo" guarda exactamente lo calculado.
  Duplicar y publicar usan el presupuesto guardado tal cual.
- La tool valida, arma el resumen (antes y después, cambios campo por campo,
  precios guardados, avisos) y guarda un `AgentProposal` PENDING con el
  payload. Devuelve `{ card: "proposal", proposalId, kind, status,
  expiresAt, summary, grounding }` con la fila guardada: los importes
  citables son los de su tarjeta (`getSummaryAmounts`). El IVA es mayor que 0
  al proponer y otra vez al confirmar.
- Precondiciones al proponer: nombre con slug válido y libre (la misma regla
  que `createBudget`, en `lib/budget-slug.ts`), cambios reales, no vinculado
  y con opciones para publicar. Cualquier admin duplica cualquier presupuesto
  (son compartidos entre admins). El slug solo cambia si
  cambia el nombre.
- Avisos de guardar cambios: siempre que se recrean las opciones con ids
  nuevos, y cuántos trabajos vinculados a una opción pierden ese vínculo
  (`SET NULL`; conservan su copia de precios); la versión oficial N+1 si hay
  un oficial vigente; la dirección nueva; la opción con productos que se
  agrega o se quita; y precios guardados que no salen del cálculo actual.
- `confirmAgentProposal(id)` (`actions/agent/confirm-proposal.ts`): admin,
  propuesta de quien confirma, claim atómico `PENDING` sin vencer →
  `EXECUTING`, re-valida el payload con zod y las precondiciones contra una
  lectura fresca (mismo `updatedAt` y mismo vínculo oficial que al proponer),
  ejecuta la acción existente, audita y deja `CONFIRMED` con `result { label,
  url, budgetId, slug, officialBudgetId, officialVersion }` o `FAILED` con el
  error. Repetirla devuelve el estado guardado: no escribe dos veces.
- Guardar cambios repite el chequeo dentro de la transacción de
  `updateBudget` (compare-and-set de `updatedAt`): si otra propuesta o un
  guardado a mano escribe en el medio, falla como propuesta vieja. El vínculo
  oficial se compara antes, fuera de esa transacción.
- `rejectAgentProposal(id)`: `PENDING` sin vencer → `REJECTED`, sin otra
  escritura. `listAgentProposals(conversationId)`: el estado vivo para la
  tarjeta (la salida guardada de la tool queda en PENDING).
- Vencen a las 24 horas. Las lecturas muestran vencida una pendiente pasada
  de hora sin escribir; se registra `EXPIRED` al intentar confirmarla o
  rechazarla. Al reintentar o regenerar, las pendientes de la respuesta
  descartada vencen con el motivo.
- Auditoría en `AgentAuditEvent`: `proposal.create`, `proposal.confirm`,
  `proposal.fail`, `proposal.reject` y `proposal.expire` (`ttl` o
  `discarded`). Sobrevive al borrado de la conversación, que borra sus
  propuestas.
- El prompt lleva "Propuestas de esta conversación" con el estado vivo de las
  últimas 30, y cada línea dice qué cambia ("Margen del servicio 45 → 40"):
  dos propuestas sobre el mismo presupuesto tienen el mismo título.
- El historial que se manda al modelo lleva el estado y el resumen vivos en
  la salida de cada tool `propose*`, con los importes citables de ese resumen
  (`withLiveProposals`, `lib/agent/proposal-context.ts`); la base conserva la
  salida original. La salida guardada dice PENDING para siempre, y en la
  prueba real el modelo le creyó a ella antes que al bloque. Una propuesta
  guardada desde el editor de la 43 tiene el resumen de lo editado.
- Una propuesta confirmada con cálculo (crear o guardar cambios) lleva en su
  línea del bloque los finales guardados, que se pueden citar
  (`getConfirmedAmounts`): un cálculo guardado desde el editor no tiene una
  salida `propose*` que los diga.
- Presupuestos y General tienen las cuatro tools; Consejos ninguna. Emails
  tiene `proposeCreateBudget` desde las reglas de precio, para guardar el
  presupuesto que calculó al responder un pedido.
- Si el servidor se corta en plena ejecución, la propuesta queda `EXECUTING`:
  no se puede saber si la escritura llegó, así que no se reintenta sola.
  Pasados 6 minutos (más que el máximo de una función en Vercel) el DTO trae
  `unknownOutcome: true` (`lib/agent/proposal-outcome.ts`): la tarjeta y el
  prompt la muestran como "resultado desconocido".
- La tarjeta de duplicar no predice la dirección (`duplicateBudget` agrega
  -2, -3…): la real llega en `result`. El número de trabajos que pierden el
  vínculo es el del momento de proponer.
- Si la conversación se borra mientras se confirma, `confirmAgentProposal`
  responde `{ success, result }` o `{ error }` sin `proposal`: el wrapper de la
  UI tiene que aceptar las dos formas.
- Ventanas que quedan, de milisegundos y documentadas: una publicación
  oficial entre la re-validación y `updateBudget` (el vínculo no mueve
  `Budget.updatedAt`), y publicar o duplicar sobre valores guardados en el
  medio por otra confirmación.

## Propuestas de visitas

Features 27a (cambiar y eliminar) y 27b (crear en lote). El mismo contrato
que las de presupuestos: la tool guarda un `AgentProposal` PENDING y las
visitas solo se escriben al confirmar.

| Tool | Tipo | Al confirmar ejecuta |
| --- | --- | --- |
| `proposeCreateVisits` | `CREATE_VISITS` | `createJobOccurrences(payload)` |
| `proposeUpdateVisit` | `UPDATE_VISIT` | `updateJobOccurrence(occurrenceId, patch)` |
| `proposeUpdateVisits` | `UPDATE_VISITS` | `updateJobOccurrences([{ occurrenceId, values: patch }])` |
| `proposeArchiveVisit` | `ARCHIVE_VISIT` | `archiveJobOccurrence(occurrenceId)` |

- Eliminar es archivar, como "Eliminar visita". Cancelar es un cambio de
  estado (`CANCELED`); "no se hizo" es `SKIPPED`.
- Entradas planas y nullable (`schemas/agent-visit-tools.ts`), horarios
  `AAAA-MM-DD HH:mm` de Montevideo, el mismo formato que devuelve
  `queryOperations`. Para encontrar la visita, `queryOperations` acepta
  `day` y cada fila trae `id`, `jobId`, `employeeIds`, notas recortadas,
  `scheduleLabel` y `fromRule`.
- `resolveVisitUpdate` (`lib/agent/visit-update-builder.ts`, puro): mover
  solo el inicio conserva la duración; el equipo es la lista completa después
  del cambio (una empleada que no existe o archivada recién agregada se
  rechaza, una inactiva se avisa); registrar horario real la marca realizada;
  realizada sin horario real toma el programado y dejar de estarlo borra el
  horario real, como el formulario de registrar. Sin cambios se rechaza.
- El payload (`schemas/agent-visit-proposals.ts`) lleva `baseUpdatedAt`,
  `baseEmployeeIds` y un `patch` estricto con solo lo que cambia, en ISO
  UTC: nunca `scheduleRuleId`, `isDetached` ni `generatedStartAt`.
- Avisos (`lib/agent/visit-warnings.ts`, hasta 3 y "Y N avisos más"): lo que
  cambia en sueldos (con el aviso de pagos ya cargados de la 27c), cruces con
  otras visitas de esas empleadas, un horario nuevo que ya pasó, empleadas
  inactivas y un trabajo que no está activo.
- Al confirmar, `runClaimed` manda las de visitas a
  `executeVisitProposal` (`lib/agent/visit-proposal-execute.ts`, `server-only`,
  sin `"use server"`): re-valida contra una lectura fresca (la visita sigue
  sin archivar, mismo `updatedAt`, mismo equipo guardado, las empleadas
  nuevas no se archivaron) y ejecuta la acción de la pantalla. El equipo se
  compara aparte porque quitar una asignación desde el trabajo no mueve el
  `updatedAt` de la visita. Queda una ventana de milisegundos entre la
  re-validación y `updateJobOccurrence`, documentada como las de
  presupuestos.
- `result` lleva `label "Visitas"`, `url /dashboard/calendar` y
  `occurrenceIds`; la tarjeta dice "Quedó en Visitas" y confirmar relee las
  consultas de visitas (`invalidateOccurrenceScopes`) en vez de las de
  presupuestos.
- Solo General las tiene, con `VISIT_RULE` en el prompt: buscar la visita
  antes, preguntar si hay más de una, una propuesta por visita y no dar nada
  por hecho hasta verlo confirmado.

### Crear en lote (27b)

- `proposeCreateVisits` (entrada plana): `jobId`, los días en `dates`
  (sueltos) **o** en `repeatFrom`, `repeatTo` y `repeatWeekdays` (1 lunes …
  7 domingo, extremos incluidos), `startTime` y `endTime` (`HH:mm`, el mismo
  día), `employeeIds` (`null` = el equipo asignado al trabajo, con
  `resolveEmployeeIds` como al generar), `notes` y `scheduleLabel`. Las dos
  formas a la vez se rechazan; una lista vacía cuenta como no mandada.
- `expandVisitDates` (`lib/agent/visit-time.ts`) expande la repetición en el
  servidor: el modelo nunca hace cuentas de calendario. El rango no pasa de
  un año; el tope de 20 visitas (`MAX_PROPOSED_VISITS`, el mismo que
  `CreateJobOccurrencesSchema`) va en `resolveCreateVisits`
  (`lib/agent/visit-create-builder.ts`, puro), con un mensaje que pide partir
  el pedido.
- Se rechaza: trabajo archivado, ningún día en el rango, fin ≤ inicio (una
  visita que cruza la medianoche se agenda en la pantalla), un equipo del
  trabajo que cambia dentro del rango (se pide `employeeIds`), empleadas que
  no existen o archivadas, y días donde el trabajo ya tiene una visita sin
  archivar que empieza a esa hora.
- La tarjeta lista cada visita en `summary.items` (`label` con el horario,
  `detail` con los cruces de esa visita) y el equipo, notas y nombre del
  cronograma en `changes`. Avisos: trabajo no activo, sin equipo, empleadas
  inactivas, cruces con otras visitas de esas empleadas (una sola lectura
  del rango, `getAgentTeamVisits`) y visitas que ya pasaron.
- El payload lleva el lote ya expandido en ISO UTC (1 a 20 visitas).
  Confirmar re-valida (`checkCreateVisitsPreconditions`): el trabajo existe
  y no está archivado, las empleadas existen y no se archivaron, y ninguna
  visita del trabajo empieza ya a esa hora (la misma propuesta dos veces o
  una visita creada en el medio). Después `createJobOccurrences`
  (`actions/ops/job-occurrence-batch.ts`) valida sesión, zod, trabajo y
  empleadas y escribe todo en una transacción en forma de arreglo
  (`createOccurrencesWithEmployees`): visitas SCHEDULED sueltas, sin regla
  ni `generatedStartAt`. Un fallo no deja visitas a medias.

### Cambiar varias visitas con una tarjeta (29)

- `proposeUpdateVisits` (`lib/agent/tools/visit-batch.ts`): de 2 a 20
  `occurrenceIds` y el mismo cambio para todas (`status`, `employeeIds`,
  `notes`, `scheduleLabel`), sin horarios: mover una visita o registrar un
  horario real distinto sigue siendo `proposeUpdateVisit`. El prompt pide una
  sola propuesta para el mismo cambio en varias visitas, nunca una tarjeta por
  visita (pasaba al marcar realizadas las de una empleada).
- `resolveUpdateVisits` (`lib/agent/visit-batch-update-builder.ts`, puro)
  resuelve cada visita con `resolveVisitUpdate`: realizada sin horario real
  toma el programado. Las que ya están así quedan fuera (con un aviso); una
  que no se puede cambiar rechaza el pedido con el nombre de la visita.
- Avisos: los de sueldos en una línea por tipo de cambio
  (`batchPayrollWarnings`, con una lectura de pagos por mes), cruces solo de
  las visitas que pasan a ocupar a alguien, y los de cada visita sin
  repetir.
- El payload lleva por visita lo mismo que `UPDATE_VISIT` (`baseUpdatedAt`,
  `baseEmployeeIds`, `patch`). Confirmar corre las precondiciones de cambiar
  una sobre cada visita marcada y después `updateJobOccurrences`
  (`actions/ops/job-occurrence-batch.ts`): cada cambio pasa por
  `prepareOccurrenceUpdate` (`lib/ops/job-occurrence-update.ts`, la misma
  validación que `updateJobOccurrence`) y se escriben todos en una
  transacción en forma de arreglo. Migración aditiva `UPDATE_VISITS`.

### Elegir las visitas del lote (29)

- Vale para `CREATE_VISITS` y `UPDATE_VISITS` (`isVisitBatchKind`).
- Con dos o más visitas, la tarjeta pone una casilla en cada fila de
  `summary.items`, todas marcadas (`useVisitSelection`,
  `components/agent/hooks/`). El usuario desmarca las que no quiere; sin
  ninguna marcada, Confirmar se apaga y el pie pide marcar una o rechazar.
- Confirmar manda las posiciones marcadas:
  `confirmAgentProposal(proposalId, visitIndexes?)`. Sin `visitIndexes`
  (todas marcadas, o un cliente viejo) se crean todas, como en la 27b.
  `visitSelectionSchema` exige al menos una, enteras y sin repetir; con otro
  tipo de propuesta se responde "Propuesta inválida" antes del claim.
- `selectProposedVisits` (`lib/agent/visit-proposal-preconditions.ts`, puro)
  filtra `payload.visits`; una posición fuera del lote deja la propuesta
  FAILED. Las precondiciones y `createJobOccurrences` corren solo sobre las
  marcadas: una visita ya tomada que se desmarcó no frena el lote.
- `result.visitIndexes` guarda las que se escribieron. La tarjeta
  confirmada tacha las otras ("No se agendó" o "Sin cambios") y la línea de
  "Propuestas de esta conversación" le dice al modelo cuáles sacó el
  usuario. Las filas de la 27b no lo tienen: se crearon todas.

## Sheet

`AgentSheetHost` (`components/agent/**`) no sabe en qué pantalla está: recibe
el contexto y el botón que lo abre.

| Pantalla | Contexto | Al abrir |
| --- | --- | --- |
| Detalle (`BudgetView.tsx`) | `{ kind: "saved", budgetId }`, leído fresco por el servidor | Retoma la última conversación del presupuesto |
| Crear (`create-budget/Header.tsx`) | `{ kind: "form", values }` con `getValues()` al enviar | Arranca una nueva |

- La sesión (`useAgentSession`) vive en el host y es dueña de la instancia
  `Chat` del AI SDK: cerrar el Sheet no corta el stream ni pierde mensajes.
  Cambiar de conversación o salir de la página la detiene.
- Un solo transport (`agent-transport.ts`) para todas las conversaciones:
  modo, habilidad y contexto viajan en el body de cada envío o reintento.
  Una redirección (sesión vencida) se informa como tal.
- Los valores inválidos del formulario (un número a medio escribir,
  empleadas vacía) no viajan (`sanitizeFormContextValues`): el servidor usa
  el valor por defecto en vez de rechazar el turno.
- Cabecera: título (el del modelo llega unos segundos después del primer
  turno), contexto, costo, abrir en la página, historial y nueva
  conversación. El modo va en el composer, junto al "+" (desde la 24, como en
  la página). "Abrir en página" lleva a `/dashboard/agent?conversacion=<id>` (sin
  id si todavía no se guardó) y está deshabilitado mientras responde (salir de
  la pantalla corta el stream) y mientras una conversación con mensajes
  todavía no figura guardada: el historial se relee al terminar el turno, y
  antes el link abriría una nueva. El modo
  muestra el modelo real de cada uno (`getAgentSettings`, con los overrides
  del entorno) y aplica a los turnos siguientes; si la conversación ya existe
  se guarda en el momento.
- Desde la 22 no hay chips: la UI siempre envía General. La habilidad sigue
  viajando con cada mensaje y se ve en la burbuja de los mensajes viejos.
- Cada tool se ve como un chip (su tipo, Lectura, Cálculo, Propuesta o
  Borrador, va en el title) y al terminar su tarjeta, según `card`. Las tools
  seguidas juntan sus chips en una fila y después van sus tarjetas. Un error
  de la tool se muestra sin alarma: el modelo suele corregirse.
- Cada respuesta cierra con "Luna 6 · Medio · 3,2k tokens · US$ 0,03" (o
  "precio no configurado"). Una detenida lo dice, también al recargar.
- La tarjeta de correo copia como email (texto y HTML), WhatsApp o Markdown
  con `getChatCopyPayload` (`lib/ai-chat-copy.ts`), más el asunto.
- La tarjeta de propuesta usa el estado vivo (`listAgentProposals`, releído
  cada 3 s mientras una se ejecuta) y no ofrece confirmar sin él. Confirmar
  invalida presupuestos, detalle, oficiales y propuestas; si cambió la
  dirección del presupuesto abierto, redirige a la nueva. Esas reglas son
  puras y tienen prueba (`lib/agent/proposal-outcome.ts`).
- Historial: conversaciones del presupuesto (o sin presupuesto en crear), en
  grupos como en la página, búsqueda sin acentos, modo y costo por fila (con
  "+ sin precio" si hubo uso sin precio, como el badge), fijar, renombrar y
  borrar. Borrar la activa arranca una
  nueva, aunque el historial se cierre antes de que responda el servidor.
- Un link de una respuesta va por `next/link` solo si es una ruta de la app
  (`/…`); `//dominio` es externo y abre en otra pestaña.
- "Costos de IA": esta conversación por tipo y modelo, el mes del equipo por
  modelo y modo (con navegación hacia atrás desde el mes del servidor) y el
  top 10. Un grupo sin precio dice "sin precio", nunca US$ 0,00.
- Errores: el `{ error }` de la ruta y el texto del stream se muestran tal
  cual; el resto, con un mensaje genérico. Reintentar reenvía el último
  mensaje (el servidor no lo duplica) con su habilidad y el modo actual.

## Página

`/dashboard/agent` (`app/(private)/dashboard/agent/page.tsx`), bajo el layout
privado que exige admin, con "Agente" en el sidebar (grupo "Asistente"). Usa
los mismos componentes que el Sheet: `AgentPageHost` es otro host para
`useAgentSession`, `AgentSessionBody` y `AgentChat`.

| Conversación | Contexto de cada turno | Cabecera |
| --- | --- | --- |
| De un presupuesto guardado | `{ kind: "saved", budgetId }`, como su Sheet | "Presupuesto: nombre", con link al presupuesto |
| Nueva, general o empezada en crear | Ninguno (el formulario de crear no existe acá) | "Sin presupuesto" |

- Historial: todas las conversaciones del usuario (las 100 más recientes),
  con el presupuesto de cada una. La búsqueda sin acentos mira el título y el
  presupuesto. Cuando la lista llega al tope lo dice (la búsqueda es sobre
  esas); una más vieja se abre igual por link. `useAgentSession` recibe un `scope` (`budget`, `no-budget` o
  `all`, `lib/agent/conversation-scope.ts`): el Sheet sigue listando las de su
  presupuesto, o las sin presupuesto en crear, que ahora incluyen las
  generales de la página.
- Diseño (feature 24, "Agente Bambu 2a-2b" de claude-design): depende del
  ancho del panel (container query `@4xl/panel`, 56rem), no de la ventana:
  con el sidebar abierto a 1024 px el chat quedaría más angosto que el Sheet.
  - Con lugar (2a): la columna del historial (búsqueda, "+" para una nueva,
    grupos y "Costos de IA · US$ x este mes" al pie) y la conversación. La
    cabecera tiene título, presupuesto con link, el costo (si ya está
    guardada) y un "…" con Nueva conversación, Costos de IA, Fijar,
    Renombrar y Borrar.
  - Sin lugar (2b, el teléfono): el historial es la pantalla de inicio, con
    título grande, filas en tarjetas como en iOS y "Costos de IA" al final.
    Una conversación se abre a pantalla completa; se vuelve con "‹ Agente" o,
    en la app instalada, deslizando desde el borde izquierdo
    (`use-edge-swipe-back.ts`; en Safari ese gesto es el "atrás"). Deslizar
    una fila a la izquierda muestra Fijar, Renombrar y Borrar
    (`use-swipe-reveal.ts`); con mouse, un "…". Se entra a la conversación si
    la dirección trae una (`use-agent-page-view.ts`).
  - En la app instalada, la conversación esconde los tabs: `data-agent-view`
    en `<html>` y la regla de `app/globals.css`. En el historial los tabs
    flotan encima y la lista deja su lugar al final.
- Grupos del historial (página y Sheet): Fijados, Hoy, Ayer y Anteriores por
  la última actividad (el último mensaje o la creación), con la hora hoy y
  ayer, "6 oct" este año y "6 oct 2025" antes. Puro, con prueba
  (`lib/agent/conversation-groups.ts`, en `check:agent-page`).
- Fijar: `pinnedAt` en `AgentConversation` (migración aditiva
  `20261008200000_agent_conversation_pinned`). El servidor las trae primero,
  así entran en el tope aunque sean viejas; el Sheet de un presupuesto sigue
  retomando la última que se tocó (`latestConversationId`), no la primera
  fijada. Se ve en el momento (actualización optimista).
- Dirección: la conversación abierta, si ya está guardada, va en
  `?conversacion=<id>` (`lib/agent/page-url.ts`). La sesión se refleja con
  `history.replaceState` (sin ida al servidor, sin remontar el chat y sin
  entradas nuevas en el historial del navegador) y solo cuando la
  conversación está lista. Un cambio que llega de afuera (entrar con el link,
  el link del sidebar) abre esa conversación o arranca una nueva: sin id se
  arranca una nueva salvo que ya lo sea (lista y sin guardar), también desde
  el error o mientras abre otra. Un id que no existe muestra "Conversación no
  encontrada" con Reintentar y "Nueva conversación", y la dirección queda con
  ese id (recargar da lo mismo); un valor que no puede ser un id se ignora.
  Las reglas son puras (`startsNewWithoutUrlId` y `pageUrlTarget`).
- Alto fijo (la pantalla menos el nav y el padding del dashboard): los
  mensajes scrollean adentro, sin arrastrar la página (`overscroll-contain`),
  y el composer queda a la vista. Los mensajes y el composer van en un ancho de
  lectura (720 px), que en el Sheet no cambia nada. Las respuestas llevan el
  logo de Bambú al lado si el hilo tiene lugar (`@lg/thread`).
- Una propuesta confirmada desde la página invalida además el historial: el
  nombre del presupuesto de la lista y de la cabecera puede cambiar.

## Editor de presupuestos

Las tarjetas de `calculateBudget`, `solveForTargetPrice` y
`proposeCreateBudget` tienen "Ver detalle" y "Editar". Los dos abren
`AgentBudgetSheet` (`components/agent/budget-editor/**`), a la derecha y
encima del chat o del Sheet de Presupuestos, con dos pestañas sobre el mismo
formulario:

- Detalle: los `BudgetDetails` sin y con productos de la página del
  presupuesto, recalculados en vivo.
- Editar: `CreateBudgetForm`, el formulario del generador, validado con
  `agentBudgetEditorSchema` (mensajes en castellano, los números del input
  convertidos y los límites de una propuesta). Los demás campos del
  generador responden en castellano con `agentBudgetEditorErrors`, que el
  resolver pasa al validar.
- Pie: los finales con IVA y "Guardar en el generador". Mientras el agente
  responde, Guardar espera: la respuesta, con la llamada a tool, se guarda en
  la base al terminar el turno.

| Tarjeta | Valores iniciales | Guardar |
| --- | --- | --- |
| Cálculo | `values` de la salida (o sus insumos, si es vieja). Nombre vacío salvo que venga del formulario de crear | Una propuesta CREATE_BUDGET nueva de esa llamada, confirmada en el momento |
| Propuesta de crear | Los `values` vivos de la propuesta | La misma propuesta, revisada con los valores editados y confirmada |

- `values` (el `BudgetFormValues` completo) sale en la salida de las tres
  tools para la UI; `toModelOutput: hideFromModel("values")` se lo saca al
  modelo, que ya tiene los insumos.
- `saveAgentBudget` (`actions/agent/save-budget.ts`): admin, valores
  válidos, la llamada a tool tiene que estar en una conversación del usuario
  y haber armado un presupuesto (`data/agent/tool-calls.ts`), y el slug libre
  (si no, el error va al campo nombre). `reviseAgentProposal` deja la
  propuesta de esa llamada (nueva, o la existente si está PENDING, REJECTED,
  EXPIRED o FAILED, con auditoría `proposal.revise`) y `confirmAgentProposal`
  la ejecuta: una sola escritura aunque se repita, y el agente la ve en el
  bloque de propuestas de los turnos siguientes, con el resumen y los finales
  de lo guardado (ver "Propuestas").
- Lo editado se guarda como se tipeó, igual que en el generador (fuente
  `edited`): sin reglas del agente, y un aporte habilitado en 0 % (o vacío)
  queda en 0, como lo muestra el editor.
- Un cálculo que parte de un presupuesto guardado se guarda como uno nuevo:
  el editor lo dice. Guardar cambios en ese presupuesto sigue siendo pedírselo
  al agente (`proposeUpdateBudget`).
- Guardado (CONFIRMED) o guardándose (EXECUTING), el editor es de solo
  lectura, con "Abrir" y "Editar en el generador", y muestra lo guardado
  (`resolveEditorValues`), nunca un borrador. Si se guarda con el editor
  abierto (desde la tarjeta o desde otra pestaña), pasa a lo guardado y
  descarta el borrador. Una EXECUTING vieja dice "resultado desconocido", en
  el editor y en la tarjeta del cálculo. La tarjeta del cálculo dice
  "Guardado en el generador"; la de la propuesta muestra el resumen vivo.
- Los cambios sin guardar quedan por llamada a tool en una ref del chat (sin
  re-render por tecla, `components/agent/hooks/use-budget-editor.ts`): se
  anotan en cada cambio mientras se puede guardar, y si vuelven a los valores
  de la tarjeta dejan de ser borrador (`isSameBudgetDraft`). Reabrir el editor
  los recupera y la tarjeta avisa; en una propuesta pendiente, avisa además
  que Confirmar la guarda sin ellos. Se pierden al recargar, al cambiar de
  conversación o al cerrar el Sheet de Presupuestos (que desmonta el chat).

## Reglas de precio

Las aplica el cálculo, no el modelo: la regla de precios prohíbe redondear a
mano y `draftEmail` solo acepta importes que salieron de una tool.
`applyAgentChanges` (`lib/agent/agent-pricing.ts`) envuelve
`applyBudgetChanges` y lo usan `calculateBudget`, `proposeCreateBudget` y
`proposeUpdateBudget`: lo que se guarda es lo que se calculó. Las cifras
(`priceStep` 100, `productsStep` 500) están en el perfil del negocio.

| Regla | Cuándo |
| --- | --- |
| El total mensual del servicio sin IVA sube al próximo múltiplo de $ 100 subiendo el margen (nunca baja, menos de $ 100) | Presupuesto nuevo o un cambio que mueve el precio del servicio sin IVA. No al abrir uno guardado, con un cambio de IVA o de productos solo, con un margen pedido ni con `roundPrice: false`; `roundPrice: true` redondea también un margen pedido |
| Transporte y productos se estiman con las horas del presupuesto | Presupuesto nuevo (`fromDefaults`), salvo que vengan los montos o `estimate*: false` |
| El estimado de productos va al múltiplo de $ 500 más cercano, mínimo $ 500 | Todo estimado (`estimateProducts`). Un monto dado se respeta |
| El precio por hora va redondeado a pesos | Todo cálculo del agente (`runBudgetCalculation`) |

- La salida de `calculateBudget` trae `rounding` (`from`, `to` y el margen
  antes y después); `changedFields` sigue siendo lo pedido. La tarjeta lo
  muestra y la de una propuesta lo lleva como aviso.
- Son citables los totales redondeados y el precio por hora en pesos; el
  precio sin redondear no.
- `solveForTargetPrice` estima un presupuesto nuevo pero no redondea: el
  objetivo es el precio pedido.
- El margen del redondeo va con 6 decimales. Con costos de más de
  $ 1.000.000 por mes puede no dar la centena: entonces el precio no se toca
  (el presupuesto guardado más caro anda por $ 360.000 con IVA).
- El editor de la 43 guarda con la fuente `edited`: lo tipeado a mano no pasa
  por las reglas (ni estimados, ni redondeo, ni el porcentaje por defecto de
  un aporte habilitado en 0).
- Los presupuestos guardados antes de la 44 conservan sus precios (con
  centavos) y se citan tal cual. Pedir "redondealo y guardalo" propone el
  cambio con `roundPrice: true`.
- Con margen de productos (opcional, 15 %), lo que paga el cliente por
  productos deja de ser múltiplo de $ 500: el redondeo es del campo
  productos, que por defecto no tiene margen.

Presupuestos iguales y pedidos de presupuesto:

- `findMatchingBudgets`: presupuestos guardados con la misma frecuencia,
  visitas, horas por visita y empleadas (y la opción con productos si se
  pide), los 10 más recientes, con sus precios guardados (citables) y si son
  oficiales vigentes. Mismos nombres de entrada que `searchOfficialBudgets`.
  La búsqueda, las filas y el aviso son puros (`lib/agent/matching-budgets.ts`)
  y la lectura, con el guard admin, está en `data/agent/budgets.ts`.
- `proposeCreateBudget` avisa en la tarjeta si ya hay guardados con el mismo
  servicio: nombra tres y cuenta el resto, o dice "y más" si pasan de 10.
- La regla de precios (`PRICE_RULE`) nombra a uno guardado igual
  (`findMatchingBudgets`) entre las fuentes citables.
- `NEW_BUDGET_RULE` (`lib/agent/system-prompt.ts`) va con las habilidades que
  calculan (General, Presupuestos y Emails): precio oficial, después uno
  guardado igual, y recién entonces calcular.
- Emails, ante un correo que pide presupuesto: saca el servicio del correo,
  sigue esos pasos, redacta con el precio y, si lo tuvo que calcular,
  propone guardarlo. Desde la 32 lee el correo de la casilla (o el que se
  pega en el chat).
- `MAX_STEPS` era 8 (ese flujo usa 6 pasos: buscar el oficial, buscar uno
  igual, calcular, redactar, proponer y contestar) y desde la 32 es 12 por
  tramo, con autocontinuado. En el smoke de la 44 tardó 26 s en
  Medio con `gpt-5.6-terra`; el turno más largo fue de 32 s. Con los modos de
  gpt-6 (Medio razona con `xhigh`) los turnos se alargaron, y
  `maxDuration` subió a 300 s (ver "Núcleo").

## Correo

Feature 32. El agente lee las casillas de Hostinger en vivo por IMAP, sin
guardar correos en la base. Solo lee: no envía, no marca como leído, no
mueve ni borra.

| Tool | Hace |
| --- | --- |
| `listEmails` | Correos de una casilla o de las dos (`mailbox` null), recibidos o enviados, sin leer, de los últimos `days` (14, hasta 90), con búsqueda en asunto, remitente o cuerpo; 15 por defecto, hasta 40, del más nuevo al más viejo. Cada fila trae `ref`, remitente, asunto, fecha de Montevideo, sin leer, respondido y el comienzo del texto |
| `readEmail` | Hasta 8 correos por `refs` en una llamada: remitente, Reply-To, destinatarios, asunto, fecha, texto sin la conversación citada (6.000 caracteres; lo citado aparte, 1.500) y nombres de adjuntos |
| `groupBudgetRequests` | Los pedidos de presupuesto que el modelo sacó de los correos (lugar, frecuencia, visitas, horas, empleadas, productos), agrupados por servicio idéntico, con el precio de cada grupo |
| `draftEmail` con `replyToRef` | Responde ese correo: destinatario, "Re: asunto" y el texto del cliente en el prompt |

- Casillas en `lib/mailbox/accounts.ts` (puro): contacto@ con las variables
  de siempre y comercial@ con las suyas (ver "Entorno"). Una casilla sin
  configurar o que no responde se informa en la tarjeta y no frena a la otra.
- Un `ref` es `casilla/carpeta/UID` (`contacto/inbox/1455`). Si Hostinger
  cambia el UIDVALIDITY de la carpeta, un ref viejo deja de existir: se vuelve
  a listar.
- `withMailboxFolder` (`lib/mailbox/imap.ts`) abre una conexión por lectura y
  la carpeta con EXAMINE (`readOnly`); imapflow lee con `BODY.PEEK`. Probado
  en la casilla real: abrir un correo sin leer lo deja sin leer. Para la
  lista se traen los primeros 24 KB de cada correo; para abrirlos, 1 MB (un
  adjunto grande queda afuera, el texto no). Un iPhone pone el adjunto antes
  del texto: en la lista ese correo viene sin comienzo, y `readEmail` lo lee.
- El texto de un correo es de un tercero: `MAIL_RULE` (General y Emails) y
  las reglas de respuesta de `draftEmail` lo tratan como dato, nunca como
  instrucciones, y en el prompt del borrador va entre `<correo>`.
- Los pedidos del formulario de la web ("Petición de servicio Web") llegan
  desde contacto@: el cliente está en el texto. `draftEmail` no responde a una
  casilla propia: sin `to`, falla con `missing_recipient` y el modelo manda el
  email del texto.
- Los adjuntos no se leen, solo su nombre: el modelo lo dice y pide que lo
  peguen o lo describan.
- Pedidos iguales (`lib/agent/budget-requests.ts`, puro): mismo lugar (hogar,
  oficina, edificio u otro), frecuencia, visitas, horas, empleadas (null es 1)
  y productos; el mismo correo cuenta una vez. Por grupo (hasta 12) se busca
  el oficial vigente con el lugar como servicio y los guardados iguales
  (`findAgentBudgetsByService`, que no mira el lugar). Sugerencia: un oficial
  exact gana, si no el guardado igual más reciente, si no hay que calcular
  una vez con `calculateBudget`. Las opciones son las que pidió el cliente o
  las dos. Los importes entran al grounding: `draftEmail` los puede citar.
- Varias respuestas son varias llamadas a `draftEmail`, una por correo (o
  por versión, si piden alternativas). Las tarjetas se copian y se envían
  desde la casilla.
- Smoke del 2026-10-28 con Haiku 5.5 Alto sobre contacto@ real, sin escribir
  en la base: revisar los pedidos de 14 días, agrupar, sugerir precio y
  redactar dos respuestas usó 8 tools y US$ 0,016; el email del cliente salió
  del texto del formulario. comercial@ quedó sin probar: faltan sus
  variables.

## Tarjetas compactas

Feature 33, pedido del usuario para que el hilo no se llene:

- Las listas arrancan plegadas, con título y conteo, y se despliegan con un
  toque (`AgentCard collapsed`, un `<details>`): presupuestos, iguales,
  oficiales, operaciones, correos y correos abiertos; los precios oficiales y
  los pedidos agrupados, cuando traen más de uno. Un presupuesto o un cálculo
  sueltos van abiertos.
- Precio: manda el sin IVA ("$ 7.950 + IVA"), al lado la ganancia mensual
  exacta y el con IVA en gris. Vale para cálculos, presupuestos guardados,
  iguales, oficiales, pedidos agrupados y propuestas.
- Ganancia (`lib/agent/budget-profit.ts`, puro): en un cálculo,
  `serviceRevenue` (+ `productsRevenue` con productos), lo mismo que la
  página del presupuesto; en uno guardado, su precio sin IVA menos el costo
  del cálculo con sus insumos (`findAgentBudgetsByService` trae las opciones
  enteras); en un oficial, el sin IVA publicado menos el costo guardado al
  publicarlo. No entra al grounding: no es un importe para clientes. Las
  propuestas guardadas antes de la 33 no la traen.
- "Abrir" de un presupuesto guardado lo muestra en un Sheet encima del hilo
  (`AgentSavedBudgetSheet`, con `getAgentSavedBudget`, solo admin) con el
  detalle de su página y un link "Página". Los oficiales siguen yendo a su
  página.
- El prompt pide no repetir en el texto lo que muestra una tarjeta y decir la
  ganancia al usuario (nunca a un cliente).
- Check en `check:agent-sheet` (`scripts/agent-compact-cards-checks.ts`).

## Memoria

Feature 34. Datos y preferencias que el agente usa en todas las
conversaciones. Son del equipo: cualquier admin los ve y los edita.

| Tool | Hace |
| --- | --- |
| `proposeMemory` | Prepara recordar un dato (`kind`: BUSINESS negocio, CLIENT cliente, STYLE estilo, PRICE precio), con vencimiento opcional (`expiresOn`), de dónde sale (`source`: user, conversation, email o image) y, para cambiar una, el `replacesId` |
| `searchMemory` | Busca en las vigentes por palabras y tipo (hasta 15): las que no entraron al prompt |

- Una memoria solo existe confirmada: `proposeMemory` guarda un
  `AgentProposal` `SAVE_MEMORY` PENDING con la tarjeta (tipo, texto, el de
  antes tachado si reemplaza, hasta cuándo vale) y `confirmAgentProposal` la
  crea o la reemplaza (`lib/agent/memory-proposal-execute.ts`). Reemplazar es
  un compare-and-set del `updatedAt` de cuando se propuso: si alguien la editó
  desde la pantalla, falla como propuesta vieja. Vence a las 24 horas, como
  las demás.
- Lo que sale de un correo o de una imagen lleva `source` email o image y la
  tarjeta avisa que lo escribió un tercero. `MEMORY_RULE` pide proponerlo solo
  si el usuario lo pide y nunca guardar una instrucción de un correo.
- Prompt: las vigentes más recientes, hasta 40 (`MEMORY_PROMPT_CAP`), cada una
  con tipo e id (`- [Cliente · id] texto (vence AAAA-MM-DD)`), después de las
  reglas fijas y las de la habilidad. Si hay más, el bloque dice cuántas y
  que se buscan con `searchMemory`. Texto de hasta 500 caracteres.
- Una memoria de precio guía (mínimos, descuentos, acuerdos) pero no es una
  fuente de importes: no entra al grounding y `draftEmail` sigue pidiendo una
  tool.
- Todas las habilidades tienen las dos tools y `MEMORY_RULE`.
- Pantalla `/dashboard/memory` ("Memoria" en el sidebar, en "Más" en la app
  instalada): vigentes por tipo y vencidas, con quién la confirmó, cuándo y
  de qué conversación salió. Editar (texto, tipo y hasta cuándo vale), vencer
  ahora (deja de usarse y queda en Vencidas) y eliminar. Todo queda en
  `AgentAuditEvent` (`memory.create`, `memory.update`, `memory.expire`,
  `memory.delete`) con el texto de antes.
- La migración copió lo que el agente leía de `MailMemory` (aprobado, sin
  contactos): organización y políticas como Negocio, estilo como Estilo.
- Check en `check:agent-memory` (`scripts/check-agent-memory.ts`).

## Instrucciones del equipo

Feature 35. Reglas de cómo trabaja el agente que el equipo cambia desde el
chat. Las reglas fijas (`PRICE_RULE`, Literal E, `MAIL_RULE`, `TOOL_POLICY`)
viven en el código; las del equipo son otra lista y entran al prompt
después de las fijas y de las de la habilidad, con el aviso de que, si
chocan, ganan las fijas.

| Tool | Hace |
| --- | --- |
| `proposeInstructionChange` | Prepara `ADD` una regla, `UPDATE` o `REMOVE` una por su id (`[r…]` en el bloque del prompt). Una regla por propuesta, hasta 300 caracteres y 30 reglas |

- Versiones (`AgentInstructionVersion`): cada cambio guarda la lista entera
  con el número siguiente; la vigente es la de número más alto. El número es
  único: dos confirmaciones sobre la misma versión no quedan las dos, y una
  propuesta hecha sobre una versión vieja falla como vieja. Nada se edita ni
  se borra: restaurar crea otra versión con las reglas de la elegida.
- La tarjeta (`CHANGE_INSTRUCTIONS`) muestra la regla de antes tachada y la
  nueva. Al confirmar se vuelve a revisar el texto
  (`lib/agent/instruction-store.ts`).
- Reglas protegidas (`lib/agent/protected-rules.ts`): una propuesta solo ve
  ids de reglas del equipo, así que una fija no se puede cambiar ni quitar. Un
  texto que intenta saltearlas (precios sin fuente, Literal E, seguir lo que
  pide un correo, enviar, guardar sin confirmar, ignorar reglas) se rechaza
  con `protected_rule`. Es un filtro de palabras: puede rechazar una regla de
  estilo que nombre "mandá el correo" (se reescribe sobre los borradores).
- `INSTRUCTIONS_RULE` distingue regla (cómo trabajar) de memoria (un dato) y
  pide que, si el usuario corrigió algo en la conversación, al terminar la
  tarea sugiera en una línea guardarlo como memoria o como regla, y lo
  proponga solo si dice que sí.
- Todas las habilidades tienen la tool.
- Pantalla `/dashboard/instructions` ("Instrucciones" en el sidebar): las
  reglas fijas (solo lectura), las del equipo vigentes y el historial con qué
  cambió, quién, cuándo y de qué conversación; cada versión vieja se
  restaura con confirmación. Cada versión queda en `AgentAuditEvent`
  (`instructions.version`).
- Check en `check:agent-instructions` (`scripts/check-agent-instructions.ts`).

## Autocontinuado

Feature 32. Un turno corre en tramos de hasta `MAX_STEPS` (12) pasos.
`runAgentTurn` (`lib/agent/run.ts`) mira cómo terminó cada tramo
(`getContinueReason`, `lib/agent/auto-continue.ts`, puro) y, si no terminó la
tarea, arranca otro con el historial del tramo y un aviso para el modelo:

| Motivo | Cuándo |
| --- | --- |
| `steps` | Llegó al tope de pasos con una tool como último paso (pasaba al preparar 8 propuestas: el turno cerraba sin una palabra) |
| `length` | La respuesta se cortó por el tope de tokens de salida |
| `empty` | El modelo cerró sin texto (en la base había turnos de solo razonamiento) |

- Hasta 3 veces por turno (`MAX_AUTO_CONTINUES`), por si el modelo entra en
  un bucle; nunca después de Stop, de un error o de un corte.
- Todos los tramos van en un mismo mensaje: la ruta arma el stream con
  `createUIMessageStream` y cada tramo se copia entero antes de empezar el
  siguiente (sin `writer.merge`, que podría mezclarlos). Un solo `start` y un
  solo `finish`, con el consumo de todos los tramos.
- El aviso ("(Aviso del sistema: …)") lo ve solo el modelo: no se guarda.
- La respuesta guarda `autoContinues` en la metadata y la línea de uso dice
  "siguió sola 1 vez".
- El prompt pide terminar la tarea sin parar a preguntar si sigue
  (`TOOL_POLICY`): en el smoke, sin esa regla, el modelo cortaba con
  "¿Sigo?".
- Smoke con Haiku 5.5 Alto: abrir 14 correos de a uno usó 15 tools, siguió
  sola una vez y cerró con la tabla (US$ 0,011).

## Imágenes y dictado

El composer (`components/agent/agent-composer.tsx`) lleva el texto arriba y
una barra abajo: "+", el modo con su costo por mensaje (en el teléfono, una
píldora que abre el menú con lo gastado en la conversación al pie), el
micrófono y un círculo verde para enviar o detener. El "+" tiene "Subir
imágenes" y un micrófono. Los dos funcionan igual en el Sheet y en la página.

| Límite | Valor | Por qué |
| --- | --- | --- |
| Imágenes por mensaje | 7 | Pedido del usuario (`AGENT_MAX_IMAGES`) |
| Lado máximo | 1600 px, JPEG 0,82 | Con gpt-6, unos 1.900 parches (unos 2.300 tokens); OpenAI rechaza más de 30.000 |
| Imagen ya achicada | 3 MB | Cada una va en su propio pedido: Vercel corta los de más de 4,5 MB |
| Original | 30 MB | Uno más grande no se abre: decodificarlo en el teléfono puede agotar la memoria |
| Dictado | 2 minutos, 4 MB | Opus a 32 kbps (unos 480 KB) o AAC en Safari; OpenAI acepta hasta 25 MB |

Los números están en `lib/agent/attachment-rules.ts`, que comparten el
navegador, las rutas y el check.

Imágenes:

- Se achican en el navegador (`lib/agent/image-compress.ts`, con la
  orientación EXIF que aplica el navegador y fondo blanco para los PNG
  transparentes) y se suben apenas se eligen, una por pedido, a `POST
  /api/agent/attachments`. La ruta exige admin, mira el tamaño antes de leer y
  el formato real por los primeros bytes (`lib/agent/image-signature.ts`: JPEG,
  PNG o WEBP; el GIF queda afuera porque OpenAI no acepta los animados).
- Se guardan en `AgentAttachment` (bytes en la base, de su dueño) sin mensaje.
  El mensaje lleva partes `file` con la dirección
  `/api/agent/attachments/<id>`, nunca un data URL: el historial queda liviano.
  `GET` la sirve solo a su dueño, con caché privado inmutable y `nosniff`.
- Al enviar, `prepareAgentTurn` valida antes de tocar la conversación que cada
  imagen sea de quien envía y esté libre (o ya sea de ese mensaje, en un
  reintento), y la vincula después de guardar el mensaje. Se borra con el
  mensaje o la conversación (cascada). Las que se subieron y nunca se enviaron
  se borran a las 24 horas, en la próxima subida.
- Reenviar un id con otras imágenes da 409, como con otro texto.
- Un mensaje puede ser solo imágenes. Su título provisorio es "Imagen
  adjunta" (o "3 imágenes adjuntas") y no se pide título al modelo, que lo
  escribe con el texto.
- El modelo no puede leer la ruta (pide sesión): `inlineHistoryImages`
  (`lib/agent/model-attachments.ts` sobre `lib/agent/history-images.ts`) cambia
  las 14 más recientes del historial por data URL antes de
  `convertToModelMessages`. Las anteriores y las borradas pasan a ser un aviso
  de texto. Con Luna 6, siete imágenes son unos US$ 0,002 por turno.
- El prompt dice que una imagen se lee como lo que escribió el usuario y que un
  importe de una imagen no es fuente de precios: la regla de precios no cambia.

Dictado:

- `useVoiceRecorder` graba con `MediaRecorder` (webm/opus en Chrome y Firefox,
  mp4 en Safari) hasta 2 minutos y manda el audio a `POST
  /api/agent/transcribe`. Se puede dictar mientras el agente responde.
- Mientras graba, como en ChatGPT (pedido del usuario el 2026-10-08): el "+"
  desaparece y el composer muestra la onda de la voz
  (`agent-voice-waveform.tsx`, una barra cada 70 ms que crece con el volumen y
  corre hacia la izquierda; en silencio, una línea de puntos), el tiempo, ■ y
  ➤. ■ deja el texto en el composer, para revisarlo o seguir dictando (el
  próximo dictado se agrega). ➤ lo envía con lo que ya estaba escrito y las
  imágenes; si el agente sigue respondiendo o falta subir una imagen, queda en
  el composer con un aviso. A los 2 minutos se corta como ■. No hay botón para
  descartar: salir de la pantalla corta sin transcribir.
- El volumen sale de un `AnalyserNode` sobre el mismo stream
  (`audio-meter.ts`, nivel en `lib/agent/audio-level.ts`). El `AudioContext`
  se crea en el toque del micrófono, antes de pedir permiso: Safari en iOS
  solo lo arranca desde un gesto. Sin Web Audio se graba igual, con la onda
  plana.
- Sin https no hay micrófono: probando el iPhone contra la PC por IP en la red
  local, el botón avisa. En producción funciona.
- `lib/ai/transcription.ts` llama a OpenAI directo (también con
  `AI_PROVIDER=gateway`) con la misma `OPENAI_API_KEY`: `@ai-sdk/openai`
  4.0.69 no conoce `gpt-transcribe` ni sus campos. Van `prompt`, `keywords[]`
  (palabras del negocio, `lib/agent/transcription-hints.ts`) y
  `languages[]=es`. Con un modelo anterior (`AI_TRANSCRIPTION_MODEL`) van
  `language` y las palabras dentro del prompt.
- Cada dictado es un `AgentUsageEvent` `TRANSCRIPTION` con `audioSeconds` y su
  costo por minuto. La duración es la que informa OpenAI o, si no la informa,
  la del navegador acotada a 2 minutos. Va a la conversación si ya existe; el
  dictado del primer mensaje de una nueva queda solo en el mes. "Costos de IA"
  lo muestra en minutos de audio, con su fila "Dictado".

## Formato de precio y empleadas

- `PRICE_FORMAT_RULE` (`lib/agent/system-prompt.ts`) va en el tono del chat y
  en las reglas de `draftEmail`: el precio de un servicio es el importe sin
  IVA seguido de "+ IVA" ("$ 54.100 + IVA", también el precio por hora). Nunca
  "Precio sin IVA" y "Precio con IVA", ni el importe con IVA salvo que lo
  pidan. En un correo: "Opción 1 (sin productos): $ X + IVA" y "Opción 2 (con
  productos): $ Y + IVA", o "Precio: $ X + IVA" con una sola. La nota de
  Literal E sigue debajo de los precios.
- Los importes permitidos le llegan a `draftEmail` sin ",00" ("$ 54.100"), así
  el modelo no los copia con centavos. El validador acepta "+ IVA" después
  del importe.
- Las tarjetas de la UI no cambian: siguen mostrando sin y con IVA.
- Empleadas: si el pedido o el correo del cliente no dice cuántas, es 1 y no
  se pregunta (`NEW_BUDGET_RULE`, las habilidades Presupuestos y Emails y el
  perfil del negocio). `searchOfficialBudgets` del agente busca con 1 cuando
  llega `null`; antes quedaba `incomplete` y el agente preguntaba. La búsqueda
  compartida (`lib/official-budgets/search.ts`) no cambia: sigue tratando
  `null` como dato faltante. `findMatchingBudgets` y
  `calculateBudget` ya usaban 1.

## Modos

Cada modo es un modelo con un esfuerzo. El selector del composer muestra el
modelo (agrupado por proveedor) y después los esfuerzos de ese modelo
(`lib/ai/model-choices.ts`), cada uno con su costo por mensaje.

| Modo (id) | Modelo | Esfuerzo | Uso |
| --- | --- | --- | --- |
| `haiku_high` (default, recomendado) | `claude-haiku-5-5` | `high` | Rápido y económico, el de todos los días |
| `haiku_xhigh` | `claude-haiku-5-5` | `xhigh` | Haiku pensando más |
| `sonnet_high` | `claude-sonnet-5-5` | `high` | Correos y presupuestos complejos |
| `opus_medium` | `claude-opus-5-5` | `medium` | Análisis exigentes |
| `bajo` | `gpt-6-luna` | `xhigh` | Económico y razona a fondo |
| `medio` | `gpt-6.1-sol` | `low` | Sol 6.1 para tareas más exigentes |
| `alto` | `gpt-6.1-sol` | `medium` | Más razonamiento para análisis y presupuestos complejos |
| Título (interno) | `gpt-6-luna` | `medium` | Nombre corto de la conversación, con `after()` |

- Desde el 2026-10-09 el default es Haiku 5.5 Alto. Sin `ANTHROPIC_API_KEY`
  (o sin gateway) el default es Bajo, para que una conversación nueva no
  falle, y los modelos de Claude se ven deshabilitados con "Falta configurar
  ANTHROPIC_API_KEY". `AI_DEFAULT_MODE` siempre manda.
- Al cambiar de modelo se elige su esfuerzo recomendado o el primero.
- Bajo, Medio y Alto conservan el id y el enum: los mensajes y consumos
  anteriores al 2026-10-09 muestran ese nombre ("Luna 6 · Medio"); los nuevos
  guardan el esfuerzo en `usage.reasoning` y muestran "Haiku 5.5 · Alto". En
  el historial, un modo se nombra por modelo y esfuerzo ("Haiku 5.5 Alto");
  en el mes, las filas de los modos de antes llevan además su nombre ("Luna 6
  Extra alto · Bajo").
- Lo que sigue de esta sección es de la etapa con tres modos de OpenAI.

- Desde el 2026-09-29, Bajo vuelve a estar activo y es el default. Los tres
  modos se aceptan en la ruta y en `AI_DEFAULT_MODE`. Una conversación
  guardada conserva su modo (`fromDbAgentMode`); no se reescriben selecciones
  anteriores. Los mensajes y consumos conservan su modo, modelo y costo
  original (`fromDbRecordedMode`). No hace falta migrar el enum de la base.
- Las etiquetas llevan la generación: `gpt-6.1-sol` es "Sol 6.1",
  `gpt-6-luna` es "Luna 6" y
  `gpt-5.6-luna` es "Luna 5.6" (`formatModelLabel`); con el razonamiento,
  "Luna 6 Extra alto" (`formatModelWithReasoning`, `REASONING_LABELS`).
- Los turnos y los borradores de `draftEmail` van con el modo (Bajo es Luna
  6 con `xhigh`). El título es una tarea chica y va con `medium`, con 8.000
  tokens de salida (`TITLE_MAX_OUTPUT_TOKENS`): el razonamiento cuenta dentro
  de ese tope, y con los 60 de antes no quedaba lugar para el título. Corre
  con `after()`, así que no demora la respuesta. Hasta el 2026-09-23 el
  título era `gpt-5.6-luna` sin razonamiento.
- Cada `AgentUsageEvent` guarda el razonamiento pedido (`reasoning`, desde
  la migración `20260923160000_agent_usage_reasoning`). "Costos de IA" lo
  muestra junto al modelo: por conversación, "Turno · Luna 6 Extra alto · 3
  turnos"; en el mes, una fila por modelo, razonamiento y modo ("Luna 6 Extra
  alto · Medio", turnos y borradores juntos) y los títulos aparte ("Luna 6
  Medio · Títulos", `buildMonthlyCostRows` en `lib/agent/usage-rows.ts`). Los
  consumos anteriores tienen `reasoning` en NULL y se muestran solo con el
  modelo ("Terra 5.6 · Medio").
- El único registro de `gpt-4.1-mini` es del smoke de la 41, que probó un
  modelo sin precio con `AI_MODEL_BAJO`.
- GPT-6.1 Sol acepta `low`, `medium`, `high`, `xhigh` y `max`; no acepta
  `none` ni `minimal`. Usa Responses para tools, como la capa actual.
- gpt-6 y gpt-5.6 aceptan `none`, `low`, `medium`, `high`, `xhigh` y `max`
  según OpenAI (gpt-5.6 no acepta `minimal`). Pero `@ai-sdk/openai` 4.0.69
  solo manda `low`, `medium`, `high`, `xhigh` y `max` a gpt-6: descarta `none`
  con un aviso y el modelo usa su default (`medium`). `max` no existe en la
  opción agnóstica `reasoning` del AI SDK.
- El modo se elige por conversación y aplica a los turnos siguientes.

## Capa de modelos

| Archivo | Responsabilidad |
| --- | --- |
| `lib/ai/modes.ts` | Modos, etiquetas de modelo y esfuerzo, defaults y spec del título. Puro |
| `lib/ai/model-choices.ts` | Modelos del selector, con sus modos y el recomendado. Puro |
| `lib/ai/model-spec.ts` | `resolveModelSpec(mode, env)`, `resolveTitleModelSpec`, `resolveDefaultMode`, `hasProviderCredentials`. Puro |
| `lib/ai/providers.ts` | `getOpenAIProvider`, `getAnthropicProvider`, `getGatewayProvider` y `resolveLanguageModel(spec)`, perezosos |
| `lib/ai/safety-identifier.ts` | `getAiSafetyIdentifier('agent', actorId)` |
| `lib/ai/call-settings.ts` | `buildAgentCallSettings(spec, { actorId })` |
| `lib/ai/pricing.ts` | Tabla de precios, `estimateUsageCost`, `formatUsd`. Puro |
| `lib/ai/usage.ts` | `normalizeUsage`, `sumUsage`, `readGatewayCost`. Puro |

Reglas:

- Fuera de `lib/ai` nadie crea proveedores ni escribe ids de modelo: se pide
  `resolveModelSpec(mode)` y se esparce `buildAgentCallSettings(spec, {
  actorId })` en `streamText` o `generateText`.
- Toda llamada va con `store: false`, un `safetyIdentifier` seudónimo con el
  namespace `agent` y `parallelToolCalls: false`.
- Los módulos marcados como puros solo importan tipos del SDK, así los usan
  los checks y, si hace falta, el cliente.
- Importar `providers.ts` no lee claves: el error aparece en la primera
  llamada ("Falta configurar OPENAI_API_KEY").

## Entorno

| Variable | Default | Efecto |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Requerida con `AI_PROVIDER=openai`: modos de OpenAI, título y dictado |
| `ANTHROPIC_API_KEY` | — | Modos de Claude con `AI_PROVIDER=openai`. Sin ella se ven deshabilitados y el default es Bajo |
| `AI_PROVIDER` | `openai` | `openai` (directo: cada modelo a su proveedor, Responses API de OpenAI o Messages API de Anthropic) o `gateway` (Vercel AI Gateway) |
| `AI_GATEWAY_API_KEY` | — | Clave del gateway. Sin ella se usa el OIDC del proyecto de Vercel: existe en los deploys y en local después de `vercel env pull`. El token local vence a las 12 horas; vencido, la llamada falla hasta volver a correr `vercel env pull` |
| `AI_DEFAULT_MODE` | `haiku_high` (`bajo` sin clave de Anthropic) | Cualquier id de la tabla de modos |
| `AI_MODEL_<MODO>` | tabla de modos | Id del modelo del modo, en mayúsculas (`BAJO`, `HAIKU_HIGH`…). Un id `claude-*` va a Anthropic |
| `AI_REASONING_<MODO>` | tabla de modos | `provider-default`, `none`, `minimal`, `low`, `medium`, `high` o `xhigh` |
| `HOSTINGER_IMAP_HOST`, `HOSTINGER_IMAP_PORT`, `HOSTINGER_IMAP_SECURE` | —, 993, `true` | Servidor IMAP de las dos casillas |
| `HOSTINGER_MAIL_USER`, `HOSTINGER_MAIL_PASSWORD` | — | Casilla contacto@. Sin ellas, `listEmails` la informa como no configurada |
| `HOSTINGER_COMERCIAL_MAIL_USER`, `HOSTINGER_COMERCIAL_MAIL_PASSWORD` | — | Casilla comercial@, igual |
| `HOSTINGER_SENT_FOLDER` | `Sent` | Enviados, si la casilla no marca la carpeta con `\Sent` |
| `AI_TRANSCRIPTION_MODEL` | `gpt-transcribe` | Modelo del dictado. Siempre va directo a OpenAI con `OPENAI_API_KEY` |
| `AI_PRICE_<MODELO>` | tabla de precios | `entrada,cacheada,salida[,escritura]` en USD por millón, con punto decimal. Sin el cuarto valor, la escritura de caché se cobra 1,25 veces la entrada, como en gpt-6 y gpt-5.6. Un campo vacío, una coma de más, hexadecimal o exponente lanzan un error |

- Una variable vacía cuenta como no configurada. Un valor inválido lanza un
  error que nombra la variable; no se ignora en silencio.
- Con `AI_PROVIDER=openai`, un modelo con `/` es un error: pide el gateway.
- `<MODELO>` es el id en mayúsculas con todo lo que no sea letra o número
  cambiado por `_`: `gpt-6-luna` → `AI_PRICE_GPT_6_LUNA`.

### Cambiar de modelo o proveedor sin tocar código

```bash
AI_PROVIDER=gateway
AI_MODEL_ALTO=anthropic/claude-sonnet-5
AI_PRICE_ANTHROPIC_CLAUDE_SONNET_5=3,0.3,15,3.75
```

- Con el gateway, un id sin `/` se manda con el prefijo de su dueño
  (`openai/<id>` o `anthropic/<id>`).
- `reasoning` es agnóstico: el SDK lo traduce al equivalente de cada
  proveedor. Las opciones de un proveedor se ignoran con otros.
- Un proveedor directo nuevo es un valor más de `AiProvider`, su dueño en
  `getModelVendor`, su clave en `PROVIDER_KEY_NAMES` y una factory en
  `providers.ts`, como Anthropic.

## Claude

- `@ai-sdk/anthropic` 4.0.75 (la última que pnpm aceptaba el 2026-10-09 por
  `minimumReleaseAge`; ya conoce `claude-haiku-5-5`, el `effort` con `xhigh`
  y `blockBinding`), a la Messages API con `ANTHROPIC_API_KEY`.
- Opciones (`buildAnthropicOptions`, `lib/ai/call-settings.ts`): pensamiento
  `adaptive` con `display: "summarized"` (se ve como el razonamiento de
  OpenAI), el `effort` del modo, `disableParallelToolUse`, `cacheControl`
  arriba (OpenAI cachea solo; Claude necesita la marca, y cada paso del turno
  lee de caché lo del anterior), `metadata.userId` seudónimo y, en Opus y
  Sonnet 5.5, `fallbacks: "default"`: un "refusal" de sus safeguards se
  reintenta en otro modelo dentro de la llamada (Haiku no tiene fallback).
- Claude no apaga el razonamiento: `none` y `minimal` van como `low`. Opus y
  Sonnet 5.5 rechazan `tool_choice` forzado: el agente usa `auto`, y la salida
  estructurada de `draftEmail` va con `output_format` nativo (el SDK lo elige
  para estos modelos).
- Pensamiento ligado: Claude ata cada bloque al modelo y a la conversación
  exacta que lo produjo, y en cuentas creadas desde el 2026-08-31 reenviar un
  bloque sobre un historial cambiado da 400. El historial del agente no es
  append-only (propuestas vivas en el prompt y en las salidas `propose*`,
  imágenes viejas como aviso, ventana de 24), así que
  `prepareHistoryForModel` (`lib/agent/model-history.ts`) no le reenvía a
  Claude el razonamiento de turnos anteriores (texto y tools sí); dentro del
  turno el SDK lo reenvía entre pasos. Con `blockBinding: drop_block`, un
  bloque que igual no corresponda se descarta en vez de fallar. A OpenAI no
  le llega el razonamiento de Claude (lo saltearía con un aviso).

## Costos

Precios del tier Standard, contexto corto, tomados de
<https://developers.openai.com/api/docs/pricing> (gpt-6 el 2026-09-23,
gpt-5.6 el 2026-09-18) y
<https://developers.openai.com/api/docs/models/gpt-6.1-sol> (2026-09-29),
en USD por millón de tokens:

| Modelo | Entrada | Entrada cacheada | Escritura de caché | Salida |
| --- | --- | --- | --- | --- |
| `gpt-6-luna` | 0.10 | 0.01 | 0.125 | 0.50 |
| `gpt-6.1-sol` | 2.00 | 0.10 | 2.50 | 10.00 |
| `gpt-6-sol` | 2.00 | 0.20 | 2.50 | 10.00 |
| `gpt-5.6-luna` | 0.20 | 0.02 | 0.25 | 1.20 |
| `gpt-5.6-terra` | 2.00 | 0.20 | 2.50 | 12.00 |
| `gpt-5.6-sol` | 4.00 | 0.40 | 5.00 | 20.00 |
| `claude-haiku-5-5` | 0.10 | 0.01 | 0.125 | 0.50 |
| `claude-sonnet-5-5` | 2.00 | 0.10 | 2.50 | 10.00 |
| `claude-opus-5-5` | 4.00 | 0.20 | 5.00 | 20.00 |

- Claude, de <https://platform.claude.com/docs/en/about-claude/pricing>
  (2026-10-09). La escritura es la de 5 minutos (1,25 veces la entrada), la
  que usa el agente; Opus y Sonnet 5.5 leen de caché a 0,05 veces la entrada.
  Haiku 5.5 cobra 5 veces más con prompts de más de 100K tokens: no se modela,
  el historial queda muy por debajo. Con el gateway, `anthropic/<id>` comparte
  precio con el id directo.
- El costo por mensaje del selector es el promedio real con 5 mensajes del
  mismo modelo y esfuerzo; antes, una estimación con los tokens típicos del
  equipo, que hasta tener uso de Claude salen de OpenAI (otro tokenizer).

- gpt-5.6 queda en la tabla para volver a un modo con `AI_MODEL_*`. El precio de `gpt-5.6-sol` es promocional "at least through
  November 21, 2026", según la página de precios; si se vuelve a usar y
  cambia, actualizar `MODEL_PRICES` o fijarlo con `AI_PRICE_GPT_5_6_SOL`.
- Dictado, en USD por minuto de audio (`TRANSCRIPTION_PRICES_PER_MINUTE`, de
  la misma página el 2026-10-08; OpenAI cobra por segundo):
  `gpt-transcribe` 0,0045, `gpt-4o-transcribe` 0,006,
  `gpt-4o-mini-transcribe` 0,003 y `whisper-1` 0,006. Un modelo fuera de la
  tabla queda sin precio.
- Costo = (entrada − cacheada − escritura) × entrada + cacheada × cacheada +
  escritura × escritura + salida × salida. Los tokens de razonamiento ya están
  dentro de la salida y no se cobran dos veces.
- No se modela el contexto largo (más de 272K tokens de entrada: doble la
  entrada y 1,5 veces la salida) porque el agente recorta el historial muy por
  debajo. Tampoco los tiers Batch, Flex ni Priority, que el agente no usa.
- Un modelo sin precio devuelve `{ costUsd: null, priced: false }`: la UI
  muestra los tokens y "precio no configurado". Nunca se inventa un precio.
- Con el gateway, `providerMetadata.gateway.cost` trae el costo real de cada
  llamada (string en USD). `readGatewayCost` lo lee; en un turno con varios
  pasos se lee y se suma por paso. Con claves propias (BYOK) el gateway puede
  informar 0 aunque el proveedor cobre.
- El costo se calcula al persistir el uso y queda fijo aunque
  después cambien los precios.
- `formatUsd` muestra "US$ 0,03", hasta cuatro decimales debajo del centavo y
  "< US$ 0,0001" para montos menores.

## Runtime

- AI SDK v7: `ai@7`, `@ai-sdk/openai@4`, `@ai-sdk/react@4`. Son ESM-only y
  exigen Node ≥ 22 (local: 24.14.1). El deploy en Vercel tiene que usar Node
  22.x o 24.x.
- pnpm exige que una versión tenga 24 horas publicada (`minimumReleaseAge`):
  al actualizar, elegir la última versión que cumpla.

## Verificación

- `pnpm check:agent-visits`: horarios de Montevideo (fechas imposibles
  rechazadas), mover conservando la duración, registrar, cancelar, equipo,
  rechazos, avisos de sueldos y cruces, payloads que pasan
  `UpdateJobOccurrenceSchema`, precondiciones, prompt y tools por habilidad y,
  por texto fuente, que las tools no escriben, que el ejecutor es
  `server-only`, re-valida antes de escribir y solo lo importa confirmar, y
  que la migración solo agrega los dos valores. Para crear en lote
  (`scripts/agent-visit-create-checks.ts`): los martes de octubre de 2026
  dan 6, 13, 20 y 27, más de 20 se rechaza, `dates` y `repeat*` juntos se
  rechazan, el equipo del trabajo, avisos, el payload pasa
  `CreateJobOccurrencesSchema`, las precondiciones y, por texto fuente, el
  lote en `$transaction([`, SCHEDULED y sin regla, y la migración con solo
  `CREATE_VISITS`.

- `pnpm check:ai-gateway`: los siete modos y los modelos del selector, Claude
  directo y por gateway, el default (Haiku con clave, Bajo sin ella), las
  credenciales por proveedor, los precios de Claude, las opciones de
  Anthropic (esfuerzo, pensamiento, caché, fallback) y el historial sin el
  razonamiento anterior (`scripts/ai-claude-checks.ts`); modos de OpenAI
  (Bajo Luna 6 xhigh, Medio Sol 6.1
  low y Alto Sol 6.1 medium, los tres aceptados en ruta y entorno, una
  conversación conserva su selección, el historial conserva el modo,
  el enum de la base con todos los modos y las etiquetas de
  cada generación, en `scripts/ai-mode-checks.ts`), overrides, prefijo del
  gateway, errores de entorno, identificador de seguridad estable y distinto
  por usuario, settings con `store: false`, costos con y sin precio (Luna 6 y
  Sol 6 más baratos que Terra), overrides de precio mal escritos
  (campos vacíos, coma de más, hexadecimal, exponente), la escritura de caché
  por defecto (1,25 veces la entrada), credenciales del gateway con clave u
  OIDC, uso normalizado, costo del gateway y, por texto fuente, que los
  proveedores no se crean a nivel de módulo.
- `pnpm check:agent-tools`: ida y vuelta de un presupuesto guardado, cálculos
  iguales a los del formulario, precio objetivo con recorte, datos del negocio
  iguales a sus constantes, prompt con regla de precios y Literal E,
  habilidades con tools reales, evidencia desde partes guardadas, los cuatro
  casos de `draftEmail` y sus fuentes citadas, consumo por turno, IVA 0
  rechazado en los cambios y base con IVA efectivo, salidas en JSON plano
  por `runTool` y, por texto fuente, que las tools no escriben ni generan
  visitas, que la migración no toca `Chat` ni `Message`, que reenviar un id
  exige el mismo texto, que el título no pisa un renombrado y que el top 10
  del mes ordena por uso con precio. Desde la 32 incluye
  `scripts/agent-mailbox-checks.ts`: casillas y variables, refs, texto sin lo
  citado (Gmail en dos líneas, Outlook, ">") y recortes, pedidos iguales y sus
  opciones, `replyToRef` y el correo como dato en el prompt, `MAIL_RULE` por
  habilidad, los motivos del autocontinuado y, por texto fuente, el tope de 3,
  el corte con Stop, los tramos en orden, un `finish`, la carpeta en
  `readOnly`, que ninguna tool de correo escribe y que la vista vieja no está.
- `pnpm check:agent-proposals`: los cuatro constructores (valores iguales a
  `calculateBudget`, categorías conservadas, antes y después, avisos, slug
  solo con el nombre, sin cambios, sin nombre, valores inválidos,
  ya oficial), payloads que sobreviven el JSON de la base, precondiciones al
  confirmar, vencimiento a las 24 horas, estados de confirmar y rechazar,
  el bloque del prompt con los cambios de cada propuesta, el estado vivo en
  el historial del modelo, las habilidades y, por texto fuente, que las tools
  no llaman a las acciones, que el store solo escribe `AgentProposal`, el
  claim de `confirm-proposal.ts`, el compare-and-set de `updateBudget`, la
  auditoría antes del cierre, el vencimiento condicional por propuesta y que
  la migración es aditiva. IVA 0 se rechaza al proponer y al confirmar.
- `pnpm check:agent-pricing`: el formato "$ X + IVA" en el chat y en
  `draftEmail` y la empleada por defecto (en
  `scripts/agent-price-format-checks.ts`), los redondeos (centavos, nunca
  hacia abajo, productos al más cercano con mínimo), un presupuesto nuevo (estimados,
  precio en centenas, `rounding`, margen, precio por hora en pesos), montos
  dados, margen pedido, `roundPrice` en sus tres valores, guardado, IVA solo,
  productos solos y formulario sin redondeo, costos de más de $ 1.000.000,
  propuestas de crear y guardar con los mismos valores y el aviso, el editor
  (`edited`) tal cual (también con un aporte en 0), el precio sin redondear
  que no se puede citar, la búsqueda de iguales (entrada, filas, importes
  citables, tope y aviso, en `scripts/agent-matching-checks.ts`), la regla de
  precios, el prompt por habilidad y, por texto fuente, quién usa
  `applyAgentChanges`, el guard y el grounding de la búsqueda, `MAX_STEPS`,
  las tarjetas y el tamaño de los archivos.
- `pnpm check:agent-sheet`: los costos por modelo y razonamiento (etiquetas,
  filas del mes con los títulos aparte, que cada llamada guarda su
  razonamiento y la migración aditiva, en `scripts/agent-usage-rows-checks.ts`),
  el cuerpo del pedido pasa el schema de la ruta
  (envío, reintento y formulario), el formulario sin campos inválidos, la
  lectura de errores, la línea de uso, los saltos de línea del Markdown, el
  resultado desconocido (DTO y prompt), las dos formas de confirmar, las
  reglas de la tarjeta de propuesta (estado vivo, cuándo se puede confirmar,
  cuándo se relee y a dónde se redirige) y, por texto fuente, que el chat
  viejo no existe, que el cliente no importa código `server-only`, que cada
  tarjeta que puede devolver una tool tiene su componente, el transport, la
  instancia `Chat` del host, la sesión, el composer, las invalidaciones, los
  links, el uso sin precio del historial y el tamaño de los archivos.
- `pnpm check:agent-page`: los scopes del historial y sus topes, el contexto
  de cada conversación, la dirección (`?conversacion=`, ids válidos, cuándo
  se arranca una nueva y qué refleja) y, por texto fuente, la ruta bajo el
  layout de admin, el sidebar, el host, la lectura propia del historial, la
  búsqueda por presupuesto, el borrado que sobrevive al cierre del historial,
  "Abrir en página" y la sesión con `scope`.
- `pnpm check:agent-attachments`: hasta 7 imágenes (ni 8, ni repetidas, ni
  direcciones ajenas, data URL o GIF), mensajes con solo imágenes, el cuerpo
  del pedido contra el schema de la ruta, el título "Imagen adjunta", las 14
  imágenes del historial y los avisos de las viejas y borradas, que cada pedido
  queda debajo de los 4,5 MB de Vercel, el achicado a 1600 px, el formato real
  por bytes, los formatos de audio, el pedido a OpenAI (`keywords[]` y
  `languages[]` con gpt-transcribe, `language` y prompt con los anteriores,
  palabras limpias), la duración de la respuesta, el costo por minuto y, por
  texto fuente, la sesión de admin de las tres rutas, el dueño de cada
  consulta, el orden de los chequeos del turno, la migración aditiva y el
  tamaño de los archivos.
- `pnpm check:agent-budget-editor`: los valores de las salidas viejas, que el
  modelo no ve `values`, la validación del editor en castellano, que guardar
  arma la misma propuesta con lo editado (aportes en 0 incluidos), qué
  muestra el editor según el estado de la propuesta, cuándo un cambio es
  borrador, los estados bloqueados, el DTO y, por texto fuente, la acción de
  guardar con su guard, el editor, las tarjetas, el resumen vivo que ve el
  modelo y el tamaño de los archivos.
