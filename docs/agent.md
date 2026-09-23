# Agente de Bambú

Contrato de producto y entorno del agente (features 38-44). El plan completo
está en `docs/agent-plan.md`; este documento describe lo que ya existe y se
actualiza con cada feature.

## Estado

- Feature 38: capa de modelos `lib/ai/**` con modos, proveedores perezosos y
  costos.
- Feature 39: núcleo en `lib/agent/**`, habilidades, tools de lectura y
  cálculo, `draftEmail`, persistencia `Agent*` y la ruta `/api/agent/chat`.
- Feature 40: propuestas. El agente prepara crear, guardar, duplicar o
  publicar como oficial un presupuesto y solo se escribe cuando el usuario
  confirma.
- Feature 41: el agente en el Sheet de Presupuestos (detalle y crear), con
  modos, habilidades, tarjetas, propuestas, historial y costos. Reemplazó al
  chat viejo (`AIChat`, `/api/ai-chat/stream`, `save-chat`), que se borró.
- Feature 42: la página `/dashboard/agent` ("Agente" en el sidebar), el mismo
  agente a ancho completo con todas las conversaciones. Comparte las
  conversaciones con el Sheet, que abre la suya en la página.
- Feature 43: los presupuestos que arma el agente (cálculos y propuestas de
  crear) se ven en detalle, se editan con el formulario del generador en un
  Sheet y se guardan en el generador desde el chat.
- Feature 44: reglas de precio. El precio sin IVA sube al próximo múltiplo de
  $ 100, los productos van en múltiplos de $ 500, antes de calcular uno nuevo
  se busca uno igual, y Emails responde un pedido de presupuesto con precio.
- Feature 45: los modos pasan a gpt-6. Medio es `gpt-6-luna` con `xhigh`
  (razona mejor que `gpt-5.6-terra` con `high` y cuesta menos) y Alto es
  `gpt-6-sol` con `medium`, también más barato que Terra. Bajo se retiró.
- Feature 46: los precios se escriben "$ 54.100 + IVA" y, si no dicen cuántas
  empleadas, el agente asume 1 sin preguntar.
- El agente de correo (`lib/mail-agent/**`) no usa esta capa y no cambia.

## Núcleo (feature 39)

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
  `searchBudgets`, `findMatchingBudgets` (feature 44), `getBudget`,
  `calculateBudget`, `solveForTargetPrice`,
  `getFinancialSnapshot`, `getFinancialTrend`, `getJobProfitability`,
  `getPayrollSummary`, `queryOperations` y `draftEmail`. Devuelven
  `{ ok, data } | { ok: false, error }` con `card` para la UI; `runTool` pasa
  cada salida por `toPlainJson`, así nunca llega un `Decimal` ni un `Date`.
- Las entradas de las tools son campos obligatorios y nullable (`null` = sin
  dato o sin cambio): con campos opcionales el modelo inventaba valores. Un
  `null` se pasa como `undefined` antes de llamar a una lectura de `data/`,
  que valida con zod.
- Las visitas se leen con `data/agent/occurrences.ts`: `getJobOccurrences` y
  `getVisitWeek` generan ocurrencias antes de leer.
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
- El conocimiento aprobado del correo (organización, políticas y estilo, sin
  contactos) entra al prompt como solo lectura.
- `maxDuration` es 60 s (Hobby sin Fluid compute). Con Fluid activo se puede
  subir a 300 si los turnos de Medio (`xhigh`) lo necesitan. El consumo se guarda en
  `onEnd`: si Vercel corta la función por `maxDuration`, el de ese turno se
  pierde (decisión pendiente junto con el valor de `maxDuration`).
- Una respuesta detenida (Stop o pedido cortado) se guarda con lo que llegó y
  la marca `stopped`. Si se corta a mitad de un paso, ese paso no informa
  consumo (OpenAI lo manda al terminar la respuesta) y no se registra: se
  cuentan solo los pasos que terminaron.
- El top 10 del informe del mes ordena por uso con precio; el uso sin precio
  lo cuenta `unpricedEvents`.

## Propuestas (feature 40)

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
  que `createBudget`, en `lib/budget-slug.ts`), cambios reales, dueño para
  duplicar, no vinculado y con opciones para publicar. El slug solo cambia si
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
  tiene `proposeCreateBudget` desde la feature 44, para guardar el
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

## Sheet (feature 41)

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
  turno), contexto, abrir en la página, historial, nueva conversación, modo y
  costo. "Abrir en página" lleva a `/dashboard/agent?conversacion=<id>` (sin
  id si todavía no se guardó) y está deshabilitado mientras responde (salir de
  la pantalla corta el stream) y mientras una conversación con mensajes
  todavía no figura guardada: el historial se relee al terminar el turno, y
  antes el link abriría una nueva. El modo
  muestra el modelo real de cada uno (`getAgentSettings`, con los overrides
  del entorno) y aplica a los turnos siguientes; si la conversación ya existe
  se guarda en el momento.
- Chips Presupuestos, Emails y Consejos (ninguno = General). La habilidad
  viaja con cada mensaje, se ve en la burbuja y sigue marcada al reabrir.
- Cada tool se ve como un chip con su tipo (Lectura, Cálculo, Propuesta,
  Borrador) y al terminar su tarjeta, según `card`. Un error de la tool se
  muestra sin alarma: el modelo suele corregirse.
- Cada respuesta cierra con "Luna 6 · Medio · 3,2k tokens · US$ 0,03" (o
  "precio no configurado"). Una detenida lo dice, también al recargar.
- La tarjeta de correo copia como email (texto y HTML), WhatsApp o Markdown
  con `getChatCopyPayload` (`lib/ai-chat-copy.ts`), más el asunto.
- La tarjeta de propuesta usa el estado vivo (`listAgentProposals`, releído
  cada 3 s mientras una se ejecuta) y no ofrece confirmar sin él. Confirmar
  invalida presupuestos, detalle, oficiales y propuestas; si cambió la
  dirección del presupuesto abierto, redirige a la nueva. Esas reglas son
  puras y tienen prueba (`lib/agent/proposal-outcome.ts`).
- Historial: conversaciones del presupuesto (o sin presupuesto en crear),
  búsqueda sin acentos, costo por fila (con "+ sin precio" si hubo uso sin
  precio, como el badge), renombrar y borrar. Borrar la activa arranca una
  nueva, aunque el historial se cierre antes de que responda el servidor.
- Un link de una respuesta va por `next/link` solo si es una ruta de la app
  (`/…`); `//dominio` es externo y abre en otra pestaña.
- "Costos de IA": esta conversación por tipo y modelo, el mes del equipo por
  modelo y modo (con navegación hacia atrás desde el mes del servidor) y el
  top 10. Un grupo sin precio dice "sin precio", nunca US$ 0,00.
- Errores: el `{ error }` de la ruta y el texto del stream se muestran tal
  cual; el resto, con un mensaje genérico. Reintentar reenvía el último
  mensaje (el servidor no lo duplica) con su habilidad y el modo actual.

## Página (feature 42)

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
- La columna del historial depende del ancho del panel (container query
  `@4xl/panel`, 56rem), no de la ventana: con el sidebar abierto a 1024 px el
  chat quedaría más angosto que el Sheet. Sin lugar, el historial va en su
  diálogo, como en el teléfono.
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
  lectura (`max-w-3xl`), que en el Sheet no cambia nada.
- Una propuesta confirmada desde la página invalida además el historial: el
  nombre del presupuesto de la lista y de la cabecera puede cambiar.

## Editor de presupuestos (feature 43)

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

## Reglas de precio (feature 44)

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
  propone guardarlo. El correo se pega en el chat: el agente no lee la
  bandeja.
- `MAX_STEPS` es 8: ese flujo usa 6 pasos (buscar el oficial, buscar uno
  igual, calcular, redactar, proponer y contestar). En el smoke tardó 26 s en
  Medio con `gpt-5.6-terra`; el turno más largo fue de 32 s. Falta medirlo con
  los modos de la feature 45 (Medio ahora razona con `xhigh`): con
  `maxDuration` en 60 s, sigue abierta la decisión de subirlo (ver "Núcleo").

## Formato de precio y empleadas (feature 46)

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
  compartida (`lib/official-budgets/search.ts`) no cambia: el agente de correo
  sigue tratando `null` como dato faltante. `findMatchingBudgets` y
  `calculateBudget` ya usaban 1.

## Modos

| Modo | Modelo | Razonamiento | Uso |
| --- | --- | --- | --- |
| Medio (default) | `gpt-6-luna` | `xhigh` | Económico y razona a fondo; el de todos los días |
| Alto | `gpt-6-sol` | `medium` | La mejor calidad para análisis y presupuestos complejos |
| Título (interno) | `gpt-6-luna` | `medium` | Nombre corto de la conversación, con `after()` |

- Desde la feature 45 (2026-09-23). Antes eran Bajo (`gpt-5.6-luna`,
  `xhigh`), Medio (`gpt-5.6-terra`, `high`) y Alto (`gpt-5.6-sol`,
  `medium`). Luna 6 con `xhigh` razona mejor que Terra con `high` a una
  fracción del precio, así que Bajo dejó de tener lugar.
- Bajo está retirado (`RETIRED_AGENT_MODES`, `lib/ai/modes.ts`): no se elige,
  la ruta lo rechaza y `AI_DEFAULT_MODE=bajo` es un error. Sigue en el enum
  `AgentMode` de la base porque lo nombra el historial. Una conversación
  guardada en Bajo se abre en Medio (`fromDbAgentMode`) y lo guarda en su
  próximo turno; los mensajes y consumos viejos conservan Bajo y su modelo
  (`fromDbRecordedMode`), así la línea de uso y "Costos de IA" dicen lo que
  se usó.
- Las etiquetas llevan la generación: `gpt-6-luna` es "Luna 6" y
  `gpt-5.6-luna` es "Luna 5.6" (`formatModelLabel`); con el razonamiento,
  "Luna 6 Extra alto" (`formatModelWithReasoning`, `REASONING_LABELS`).
- Los turnos y los borradores de `draftEmail` van con el modo (Medio es Luna
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
- gpt-6 y gpt-5.6 aceptan `none`, `low`, `medium`, `high`, `xhigh` y `max`
  según OpenAI (gpt-5.6 no acepta `minimal`). Pero `@ai-sdk/openai` 4.0.69
  solo manda `low`, `medium`, `high`, `xhigh` y `max` a gpt-6: descarta `none`
  con un aviso y el modelo usa su default (`medium`). `max` no existe en la
  opción agnóstica `reasoning` del AI SDK.
- El modo se elige por conversación y aplica a los turnos siguientes.

## Capa de modelos

| Archivo | Responsabilidad |
| --- | --- |
| `lib/ai/modes.ts` | Modos, etiquetas, defaults y spec del título. Puro |
| `lib/ai/model-spec.ts` | `resolveModelSpec(mode, env)`, `resolveTitleModelSpec`, `resolveDefaultMode`. Puro |
| `lib/ai/providers.ts` | `getOpenAIProvider`, `getGatewayProvider` y `resolveLanguageModel(spec)`, perezosos |
| `lib/ai/safety-identifier.ts` | `getAiSafetyIdentifier('agent' \| 'mail', actorId)` |
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
| `OPENAI_API_KEY` | — | Requerida con `AI_PROVIDER=openai` |
| `AI_PROVIDER` | `openai` | `openai` (directo, Responses API) o `gateway` (Vercel AI Gateway) |
| `AI_GATEWAY_API_KEY` | — | Clave del gateway. Sin ella se usa el OIDC del proyecto de Vercel: existe en los deploys y en local después de `vercel env pull`. El token local vence a las 12 horas; vencido, la llamada falla hasta volver a correr `vercel env pull` |
| `AI_DEFAULT_MODE` | `medio` | `medio` o `alto` |
| `AI_MODEL_<MODO>` | tabla de modos | Id del modelo de `MEDIO` o `ALTO`. `AI_MODEL_BAJO` y `AI_REASONING_BAJO` ya no se leen |
| `AI_REASONING_<MODO>` | tabla de modos | `provider-default`, `none`, `minimal`, `low`, `medium`, `high` o `xhigh` |
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

- Con el gateway, un id sin `/` se manda como `openai/<id>`: los modos que no
  se tocan siguen en gpt-6.
- `reasoning` es agnóstico: el SDK lo traduce al equivalente de cada
  proveedor. Las opciones `providerOptions.openai` se ignoran con otros.
- Un proveedor directo nuevo (por ejemplo `@ai-sdk/anthropic`) es un literal
  más en `AI_PROVIDERS` y una factory en `providers.ts`.

## Costos

Precios del tier Standard, contexto corto, tomados de
<https://developers.openai.com/api/docs/pricing> (gpt-6 el 2026-09-23,
gpt-5.6 el 2026-09-18), en USD por millón de tokens:

| Modelo | Entrada | Entrada cacheada | Escritura de caché | Salida |
| --- | --- | --- | --- | --- |
| `gpt-6-luna` | 0.10 | 0.01 | 0.125 | 0.50 |
| `gpt-6-sol` | 2.00 | 0.20 | 2.50 | 10.00 |
| `gpt-5.6-luna` | 0.20 | 0.02 | 0.25 | 1.20 |
| `gpt-5.6-terra` | 2.00 | 0.20 | 2.50 | 12.00 |
| `gpt-5.6-sol` | 4.00 | 0.40 | 5.00 | 20.00 |

- gpt-5.6 queda en la tabla para volver a un modo con `AI_MODEL_*`. El precio de `gpt-5.6-sol` es promocional "at least through
  November 21, 2026", según la página de precios; si se vuelve a usar y
  cambia, actualizar `MODEL_PRICES` o fijarlo con `AI_PRICE_GPT_5_6_SOL`.
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
- El costo se calcula al persistir el uso (feature 39) y queda fijo aunque
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

- `pnpm check:ai-gateway`: modos (Medio y Alto en gpt-6, Bajo rechazado en la
  ruta y el entorno, una conversación en Bajo abre en Medio, el historial
  conserva Bajo, el enum de la base con todos los modos y las etiquetas de
  cada generación, en `scripts/ai-mode-checks.ts`), overrides, prefijo del
  gateway, errores de entorno, identificador de seguridad igual al del
  correo, settings con `store: false`, costos con y sin precio (Luna 6 y
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
  del mes ordena por uso con precio.
- `pnpm check:agent-proposals`: los cuatro constructores (valores iguales a
  `calculateBudget`, categorías conservadas, antes y después, avisos, slug
  solo con el nombre, sin cambios, sin nombre, valores inválidos, dueño,
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
- `pnpm check:agent-budget-editor`: los valores de las salidas viejas, que el
  modelo no ve `values`, la validación del editor en castellano, que guardar
  arma la misma propuesta con lo editado (aportes en 0 incluidos), qué
  muestra el editor según el estado de la propuesta, cuándo un cambio es
  borrador, los estados bloqueados, el DTO y, por texto fuente, la acción de
  guardar con su guard, el editor, las tarjetas, el resumen vivo que ve el
  modelo y el tamaño de los archivos.
