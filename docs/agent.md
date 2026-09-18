# Agente de Bambú

Contrato de producto y entorno del agente (features 38-41). El plan completo
está en `docs/agent-plan.md`; este documento describe lo que ya existe y se
actualiza con cada feature.

## Estado

- Feature 38: capa de modelos `lib/ai/**` con modos, proveedores perezosos y
  costos.
- Feature 39: núcleo en `lib/agent/**`, habilidades, tools de lectura y
  cálculo, `draftEmail`, persistencia `Agent*` y la ruta `/api/agent/chat`.
- Feature 40: propuestas. El agente prepara crear, guardar, duplicar o
  publicar como oficial un presupuesto y solo se escribe cuando el usuario
  confirma. Todavía sin UI (41): las acciones existen, la tarjeta no.
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
  primer turno que falló). Solo reemplaza el título que tenía al empezar el
  turno: un renombrado gana.
- Habilidades en `lib/agent/skills/**`: General (todas las tools),
  Presupuestos, Emails y Consejos. Todas las tools quedan registradas y la
  habilidad elige las activas (`activeTools`), así el historial puede traer
  tools de otra habilidad.
- Tools en `lib/agent/tools/**`, sin escrituras: `getBusinessProfile`,
  `searchOfficialBudgets`, `listOfficialBudgets`, `getOfficialBudget`,
  `searchBudgets`, `getBudget`, `calculateBudget`, `solveForTargetPrice`,
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
  subir a 300 si los turnos de Bajo lo necesitan. El consumo se guarda en
  `onEnd`: si Vercel corta la función por `maxDuration`, el de ese turno se
  pierde (decisión pendiente junto con el valor de `maxDuration`).
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
- El historial que se manda al modelo lleva el estado vivo en la salida de
  cada tool `propose*` (`withLiveProposals`, `lib/agent/proposal-context.ts`);
  la base conserva la salida original. La salida guardada dice PENDING para
  siempre, y en la prueba real el modelo le creyó a ella antes que al bloque.
- Presupuestos y General tienen las cuatro tools; Emails y Consejos no.
- Si el servidor se corta en plena ejecución, la propuesta queda `EXECUTING`:
  no se puede saber si la escritura llegó, así que no se reintenta sola. La
  UI tiene que mostrar una EXECUTING vieja como "resultado desconocido".
- La tarjeta de duplicar no predice la dirección (`duplicateBudget` agrega
  -2, -3…): la real llega en `result`. El número de trabajos que pierden el
  vínculo es el del momento de proponer.

## Modos

| Modo | Modelo | Razonamiento | Uso |
| --- | --- | --- | --- |
| Bajo | `gpt-5.6-luna` | `xhigh` | El más económico; razona a fondo, puede tardar más |
| Medio (default) | `gpt-5.6-terra` | `high` | Equilibrio entre calidad, velocidad y costo |
| Alto | `gpt-5.6-sol` | `medium` | La mejor calidad para análisis y presupuestos complejos |
| Título (interno) | `gpt-5.6-luna` | `none` | Nombre corto de la conversación |

- La familia gpt-5.6 acepta `none`, `low`, `medium`, `high`, `xhigh` y `max`.
  No acepta `minimal`, por eso el título usa `none`. `max` no existe en la
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
| `AI_DEFAULT_MODE` | `medio` | `bajo`, `medio` o `alto` |
| `AI_MODEL_<MODO>` | tabla de modos | Id del modelo de `BAJO`, `MEDIO` o `ALTO` |
| `AI_REASONING_<MODO>` | tabla de modos | `provider-default`, `none`, `minimal`, `low`, `medium`, `high` o `xhigh` |
| `AI_PRICE_<MODELO>` | tabla de precios | `entrada,cacheada,salida[,escritura]` en USD por millón, con punto decimal. Sin el cuarto valor, la escritura de caché se cobra 1,25 veces la entrada, como en gpt-5.6. Un campo vacío, una coma de más, hexadecimal o exponente lanzan un error |

- Una variable vacía cuenta como no configurada. Un valor inválido lanza un
  error que nombra la variable; no se ignora en silencio.
- Con `AI_PROVIDER=openai`, un modelo con `/` es un error: pide el gateway.
- `<MODELO>` es el id en mayúsculas con todo lo que no sea letra o número
  cambiado por `_`: `gpt-5.6-terra` → `AI_PRICE_GPT_5_6_TERRA`.

### Cambiar de modelo o proveedor sin tocar código

```bash
AI_PROVIDER=gateway
AI_MODEL_ALTO=anthropic/claude-sonnet-5
AI_PRICE_ANTHROPIC_CLAUDE_SONNET_5=3,0.3,15,3.75
```

- Con el gateway, un id sin `/` se manda como `openai/<id>`: los modos que no
  se tocan siguen en gpt-5.6.
- `reasoning` es agnóstico: el SDK lo traduce al equivalente de cada
  proveedor. Las opciones `providerOptions.openai` se ignoran con otros.
- Un proveedor directo nuevo (por ejemplo `@ai-sdk/anthropic`) es un literal
  más en `AI_PROVIDERS` y una factory en `providers.ts`.

## Costos

Precios del tier Standard, contexto corto, tomados de
<https://developers.openai.com/api/docs/pricing> el 2026-09-18, en USD por
millón de tokens:

| Modelo | Entrada | Entrada cacheada | Escritura de caché | Salida |
| --- | --- | --- | --- | --- |
| `gpt-5.6-luna` | 0.20 | 0.02 | 0.25 | 1.20 |
| `gpt-5.6-terra` | 2.00 | 0.20 | 2.50 | 12.00 |
| `gpt-5.6-sol` | 4.00 | 0.40 | 5.00 | 20.00 |

- El precio de Sol es promocional "at least through November 21, 2026",
  según la página de precios. Cuando cambie, actualizar `MODEL_PRICES` o
  fijarlo con `AI_PRICE_GPT_5_6_SOL`: hasta entonces el costo de Alto se
  registra con el precio promocional y queda fijo.
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

- `pnpm check:ai-gateway`: modos, overrides, prefijo del gateway, errores de
  entorno, identificador de seguridad igual al del correo, settings con
  `store: false`, costos con y sin precio, overrides de precio mal escritos
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
