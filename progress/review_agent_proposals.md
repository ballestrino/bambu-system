# Review - agent_proposals

**Verdict:** APPROVED

La re-revisión del commit `b6becae` aprueba la feature: está al final, en
"Re-revisión (b6becae)". Lo que sigue hasta esa sección es la primera
revisión, sobre `a63a8b0`, que había pedido cambios.

Rama `feature/40-agent-proposals`, HEAD `a63a8b0`. Revisé `113a6ea..a63a8b0`
(`05dab3f` feat y `a63a8b0` docs) contra `docs/architecture.md`,
`docs/conventions.md`, `docs/verification.md`, `CHECKPOINTS.md`,
`docs/agent-plan.md` (feature 40 y "Ajustes al implementar la 40"),
`docs/agent.md` ("Propuestas"), `progress/current.md`,
`progress/impl_agent_proposals.md` y la entrada 40 de `feature_list.json`.

Todos los checks pedidos pasan y no hay violaciones de arquitectura. El
rechazo se debe a un solo bloqueante (hallazgo 1): con IVA 0, una propuesta
confirmada guarda precios distintos de los que mostró la tarjeta.

## Findings

### Bloqueante

1. **Con IVA 0, lo que se guarda no es lo que mostró la tarjeta (ni lo que calculó `calculateBudget`).**
   - **Qué pasa.** El modelo puede mandar `iva: 0`, porque
     `schemas/agent-tools.ts:37` acepta `min(0)` y
     `proposalBudgetValuesSchema` (`schemas/agent-proposals.ts:9-12`) lo deja
     pasar al proponer y al confirmar. Un formulario sin guardar con IVA 0
     hace lo mismo. La tarjeta calcula los totales con
     `calculateBudgetTotals`, que convierte el 0 en 22
     (`lib/budget-calculations.ts:106`, `Number(values.iva) || 22`), y
     `after.ivaPercent` dice 22 (`lib/agent/budget-calculation.ts:78`). Al
     mismo tiempo, `inputs.ivaPercent` dice 0
     (`lib/agent/budget-calculation.ts:130`) y `changes` muestra
     "IVA 22 → 0", aunque los totales no cambian. Al confirmar,
     `createBudget` y `updateBudget` guardan la opción sin productos como
     `priceNoTaxService * (1 + iva / 100)` con el IVA crudo
     (`actions/budgets/create-budget.ts:116`,
     `actions/budgets/update-budget.ts:146`), o sea el precio sin IVA. La
     opción con productos guarda `values.price`, que es el final con 22 %.
     Las dos opciones quedan con `iva: 0`.
   - **Cómo lo reproduje** (script puro sobre el fixture del check, sin
     base). Con `buildUpdateBudgetProposal({ changes: { iva: 0 } })`:
     - La tarjeta muestra, sin productos, $ 8.873,62 con IVA 22.
     - `updateBudget` guardaría $ 7.273,46.
     - La opción con productos queda en $ 9.795,94 (con 22 %) e `iva: 0`.
     - `buildCreateBudgetProposal` desde los valores por defecto da lo mismo.
   - **Por qué importa.** Rompe el contrato de la feature
     (`docs/agent.md`: "'calculalo y guardalo' guarda exactamente lo
     calculado"). El presupuesto confirmado queda con precios distintos de
     la tarjeta e incoherentes entre sus dos opciones. Si está vinculado a un
     oficial ACTIVE, `updateBudget` → `appendLinkedOfficialBudgetVersion`
     (`actions/budgets/update-budget.ts:153`) publica esa versión incoherente
     como precio de lista, y el agente y el correo la citan como oficial. Se
     llega con un pedido natural: "guardalo sin IVA" (la nota de Literal E
     dice que se aplica el monto sin IVA) o con IVA 0 en el formulario
     abierto.
   - **Contexto.** La causa (`|| 22` en el cálculo contra el IVA crudo en las
     acciones) es previa a esta feature y el formulario manual la comparte
     (ver "Fuera de alcance"). Hoy ningún presupuesto guardado tiene IVA 0
     (las 331 opciones tienen 22, según una lectura de solo lectura), así que
     solo se dispara con un pedido explícito.
   - **Arreglo mínimo, dentro de la feature.** Rechazar `iva <= 0` en el
     camino de las propuestas y agregar la aserción en
     `check:agent-proposals`. Por ejemplo, `iva: z.number().positive()` en
     `proposalBudgetValuesSchema`, que se valida al proponer y otra vez al
     confirmar, o un `refuse("invalid_iva", …)` claro en los builders.

### Menores (no bloqueantes)

2. **Entre la re-validación y la escritura hay una ventana de carrera.**
   - **Qué pasa.** `actions/agent/confirm-proposal.ts:107-111` compara
     `updatedAt` y el vínculo oficial con una lectura fresca y recién después
     llama a `updateBudget`. Esa acción escribe sin volver a comparar
     `updatedAt` dentro de su transacción
     (`actions/budgets/update-budget.ts:54-96`). El claim es por propuesta, no
     por presupuesto. Si se confirman casi a la vez dos propuestas distintas
     sobre el mismo presupuesto (la de 40 % y la de 35 %), o alguien guarda a
     mano durante una confirmación, las dos pasan el chequeo y las dos
     escriben.
   - **Por qué importa.** Gana la última escritura y las dos quedan
     CONFIRMED. Con un oficial vinculado se publican dos versiones (N+1 y
     N+2), justo lo que `baseUpdatedAt` quería evitar. La ventana dura lo que
     tarda `updateBudget`, unos cientos de ms contra Neon. La prueba real
     cubrió el caso secuencial (el 35 % falló bien), no el concurrente.
   - **Sugerencia.** Un chequeo optimista dentro de la transacción: un
     `expectedUpdatedAt` opcional en `updateBudget` con
     `updateMany({ where: { id, updatedAt } })`, abortando si `count` es 0. Si
     no se hace ahora, que la 41 no deje confirmar otra propuesta del mismo
     presupuesto mientras una está EXECUTING. Publicar y duplicar tienen la
     misma ventana, con menos impacto: `publishOfficialBudgetInTransaction`
     toma `FOR UPDATE` y el vínculo es único.

3. **El camino idempotente de `saveAgentProposal` devuelve la tarjeta nueva con el id viejo.**
   - **Qué pasa.** Si choca `(conversationId, toolCallId)` (P2002,
     `lib/agent/proposal-store.ts:59-69`), la tool responde con `kind`,
     `summary` y `grounding` del cálculo recién hecho, pero con el
     `proposalId` y el `status` de la propuesta guardada
     (`lib/agent/tools/proposals.ts:33-52`).
   - **Por qué importa.** Justo en el caso que el plan usa para justificar el
     único por conversación (un proveedor que repite ids), la tarjeta
     describiría una cosa y `confirmAgentProposal` ejecutaría el payload
     guardado.
   - **Arreglo.** Con los ids de OpenAI es improbable, y el arreglo es trivial:
     devolver `proposal.kind` y `proposal.summary` (ya vienen en
     `proposalSelect`) o rechazar si no coinciden.

4. **Una propuesta EXECUTING no tiene salida, y la escritura puede quedar sin auditar.**
   - **Qué pasa.** Si falla el `update` final a CONFIRMED o FAILED
     (`actions/agent/confirm-proposal.ts:154-160`), por un error de base o
     porque borraron la conversación en el medio (P2025), el catch devuelve
     "Error al confirmar la propuesta" aunque la escritura haya llegado. La
     propuesta queda EXECUTING para siempre: no se puede rechazar, y
     `markProposalExpired` y `expireDiscardedProposals` solo tocan PENDING
     (`lib/agent/proposal-store.ts:88`, `:111`). Tampoco queda
     `proposal.confirm` en `AgentAuditEvent`, porque se audita después del
     update.
   - **Contexto.** Está documentado como decisión para el corte del servidor.
   - **Sugerencia.** Auditar el resultado antes del `update` final, o tratar
     en la 41 y en el bloque del prompt una EXECUTING con `updatedAt` de más
     de N minutos como "resultado desconocido".

5. **La auditoría de `expireDiscardedProposals` no mira el resultado del update condicional.**
   - **Qué pasa.** `lib/agent/proposal-store.ts:109-131` lee las PENDING, las
     actualiza con `status: "PENDING"` y audita `proposal.expire (discarded)`
     por cada fila leída. Si una se confirmó entre la lectura y el update, no
     vence, y eso está bien. Pero igual queda auditada como vencida, junto a
     su `proposal.confirm`.
   - **Arreglo.** Actualizar por id y auditar solo con `count === 1`, como ya
     hace `markProposalExpired`.

6. **El slug que muestra la tarjeta de duplicar es una predicción.**
   - **Qué pasa.** `lib/agent/stored-budget-proposals.ts:40` muestra
     `slugifyBudgetName("X (copia)")`, pero `duplicateBudget` usa
     `findUniqueSlug` (`actions/budgets/duplicate-budget.ts:7-17,44-45`) y
     agrega `-2`, `-3`… si ya existe. Duplicar dos veces el mismo presupuesto
     alcanza para que la dirección guardada sea otra.
   - **Contexto.** `result.slug` y `result.url` traen la real.
   - **Sugerencia.** No mostrar ese slug en la tarjeta de duplicar, o
     marcarlo como tentativo. La 41 tiene que usar el `result`.

7. **`result.officialBudgetId` queda en null al guardar un presupuesto vinculado.**
   - **Qué pasa.** `budgetResult` fija `officialBudgetId: null`
     (`actions/agent/confirm-proposal.ts:34-44`). En `UPDATE_BUDGET`
     (`:66`), `officialVersion` llega con N+1 pero sin el id, aunque
     `updateBudget` devuelve `officialBudget.id`.
   - **Por qué importa.** La 41 no puede enlazar la versión oficial nueva
     solo con el `result`.
   - **Arreglo.** Pasar `result.budget.officialBudget?.id ?? null`.

8. **Detalle: el número de trabajos que pierden el vínculo puede quedar viejo.**
   - **Qué pasa.** Vincular un trabajo a una opción no cambia
     `Budget.updatedAt`, así que la precondición no lo ve
     (`lib/agent/proposal-summary.ts:81-92`).
   - **Contexto.** El aviso general de opciones recreadas está siempre, así
     que no hace falta cambiar código. Solo conviene no presentar ese número
     como exacto en la 41.

### Verificado sin hallazgos

- **Pertenencia.** Confirmar busca y reclama con `{ id, actorId }`, y
  rechazar hace el update condicional con `actorId`. `getAgentProposal` y
  `getConversationProposals` filtran por `session.user.id`. Las tools usan
  `ctx.actorId` y la conversación ya reclamada por `claimAgentConversation`.
  El P2002 busca por `(conversationId, toolCallId)`, así que no cruza
  conversaciones. El DTO no expone el `payload`.
- **Claim e idempotencia.**
  - El `updateMany` condicional de PENDING sin vencer a EXECUTING es atómico
    en Postgres: la segunda sentencia reevalúa el `WHERE` y da `count` 0.
  - Confirmar contra confirmar, confirmar contra rechazar y rechazar contra
    rechazar devuelven el estado guardado sin escribir de nuevo.
  - Una vencida se registra EXPIRED y audita una sola vez (`count`).
  - Los bordes `expiresAt > now` e `isProposalExpired` (`<=`) son
    complementarios y están probados.
- **Re-validación.** `zod` corre sobre el payload guardado, que es inmutable
  (nada lo actualiza).
  - UPDATE compara `updatedAt` y el id del oficial. Archivar desvincula
    (`sourceBudgetId: null`), así que también lo detecta.
  - DUPLICATE compara `updatedAt` y el dueño.
  - PUBLISH compara `updatedAt` y que no haya vínculo.
  - Solo `updateBudget` escribe `BudgetOption`, y siempre pasa por
    `tx.budget.update`, así que mueve `updatedAt`.
  - Un error inesperado dentro de `runClaimed` termina en FAILED, no en
    EXECUTING.
- **Valores guardados, con IVA distinto de 0.**
  - Precios: con margen 40, la tarjeta da $ 8.567,63 y $ 9.489,95, y se
    guardarían 8.567,6297 y 9.489,95 (iguales al centavo).
  - Categorías: UPDATE las conserva desde `getAgentBudget`; CREATE las toma
    del formulario o de la base guardada.
  - Slug: crear y guardar usan la misma regla que la acción, y el slug solo
    cambia si cambia el nombre.
- **Refactor del slug.** Es la misma cadena de `replace`. Un fuzz de 400.000
  nombres (incluidos los "(copia)") contra la regla anterior de `113a6ea`
  dio 0 diferencias.
- **`resolveBudgetBase` → `getAgentBudget` no rompe `calculateBudget`.**
  - La base es la misma: `budgetOptionToFormValues` elige la opción con
    productos, y el orden nuevo `createdAt`/`id` no cambia esa elección.
  - Las categorías no entran en el cálculo ni en la salida.
  - "No encontré" es igual, y la ruta ya exigía admin.
  - `check:agent-tools` sigue en verde.
- **Vencimiento al regenerar.** `expireDiscardedProposals` corre después de
  `discardMessagesAfter` y con el mismo corte (`createdAt >` el del mensaje
  del usuario). Solo toca PENDING: una confirmada se queda confirmada y sigue
  en el bloque del prompt.

### Fuera de alcance (para otra feature)

- El formulario manual tiene la misma incoherencia con IVA 0: la vista previa
  muestra "IVA 0%" (`components/budgets/create-budget/BudgetPreview.tsx:45`),
  los totales usan 22 y la acción guarda la opción sin productos sin IVA.
  Conviene decidir si `calculateBudgetTotals` debe usar `?? 22` en vez de
  `|| 22`.
- `data/budget.ts` empieza con `"use server"`, aunque es una lectura. Es
  previo a esta feature.

## Checkpoints

- **C1: [x]** Existen los archivos del harness y `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35). La 40 sigue `pending` a
  propósito hasta que se libere el slot, y `progress/current.md` la describe
  con su estado real.
- **C3: [x]**
  - Las escrituras de presupuestos pasan solo por las acciones existentes de
    `actions/`.
  - `confirm-proposal.ts` y `reject-proposal.ts` llaman a
    `requireAdminSession()` primero. `listAgentProposals` delega el guard en
    `data/agent/proposals.ts`, como las lecturas de la 39.
  - Las lecturas están en `data/agent/*` y los zod en
    `schemas/agent-proposals.ts` y `schemas/agent-tools.ts`. Los helpers
    puros están en `lib/agent/*`.
  - `AgentProposal` se persiste en `lib/agent/proposal-store.ts`
    (`server-only`, solo `agentProposal` según el check de fuente), con el
    mismo patrón que la 39 usa para persistir el turno y que documenta
    `docs/architecture.md`.
  - Las tools no importan `actions/` ni `lib/db`.
  - Todos los archivos tienen 200 líneas o menos (el más largo, 196).
    `schema.prisma` es excepción.
  - No hay UI.
- **C4: [x]** Pasan `pnpm harness`, lint, `prisma validate` y `next build`.
  No hay cambios de UI.
- **C5: [x]**
  - No quedan archivos temporales: la ruta de prueba de confirmar y rechazar
    se borró.
  - El árbol está limpio, salvo el `review_ai_model_gateway.md` sin trackear
    de otro revisor.
  - No se agregan `console.log`, `debugger` ni TODO. El único `console.log`
    nuevo es el mensaje de éxito del check, igual que en los demás checks.
    Los de `createBudget` son previos (feature 3).

## Evidence

- `.\init.ps1` (PowerShell): **pass**, exit 0. Harness OK (41 features, una
  `in_progress`), `prisma validate` OK y ESLint OK.
- `pnpm exec tsc --noEmit --incremental false`: **pass**, exit 0 y sin
  errores en 14 s. Con `--listFilesOnly` verifiqué que incluye los archivos
  nuevos.
- `pnpm check:agent-proposals`: **pass** ("Agent proposal checks passed").
- `pnpm check:agent-tools`: **pass**.
- `pnpm check:official-budgets`: **pass**.
- `pnpm check:official-budget-workspace`: **pass**.
- `pnpm exec prisma migrate status` (solo lectura): **pass**. 21 migraciones,
  "Database schema is up to date!".
- Lectura de control de solo lectura contra la base del `.env`: **coincide
  con el reporte**.
  - `_prisma_migrations`: `20260918180000_agent_proposals` terminó el
    2026-09-18T20:20:37Z, no está revertida y tiene un paso.
  - Índices: `pkey`, el único `(conversationId, toolCallId)`,
    `(conversationId, createdAt)` y `(actorId, createdAt)`.
  - Las dos FKs son `ON DELETE CASCADE`.
  - Hay 0 propuestas, 200 presupuestos y 16 oficiales.
  - Auditoría `proposal.*`: 8 create, 3 confirm, 1 fail, 1 reject y 2 expire
    (1 `ttl`, 1 `discarded`).
- `pnpm exec next build` sobre HEAD `a63a8b0`: **pass**. Cubre las features
  38, 39 y 40. Compiló en 8,8 s, pasó TypeScript, generó 29 páginas
  estáticas y listó 38 rutas, entre ellas `ƒ /api/agent/chat`. Tardó 30,9 s
  en total.
- Equivalencia del slug (fuzz en el scratchpad): **pass**, 0 diferencias en
  400.000 comparaciones.
- Tarjeta contra lo guardado (script puro en el scratchpad): **falla con IVA
  0** (hallazgo 1). Con margen 40 coincide al centavo.
- IVA de las opciones guardadas (solo lectura): las 331 opciones tienen IVA
  22.

## Criterios de aceptación

1. **Las cuatro tools `propose*` guardan PENDING y nunca escriben
   presupuestos durante el turno: cumplido.** Lo prueba el check de fuente:
   sin llamadas a acciones ni `db.budget.`, y el store solo escribe
   `agentProposal`. En la prueba real seguía habiendo 200 presupuestos
   después del turno.
2. **La propuesta de guardar muestra antes y después y avisa de opciones
   recreadas y de la versión oficial automática: cumplido.** El check prueba
   antes y después, el aviso con los 3 trabajos vinculados y "versión oficial
   4 (hoy rige la 3)". Salvedad: con IVA 0, el "después" no es lo que se
   guarda (hallazgo 1).
3. **`confirmAgentProposal` re-valida, reclama de forma atómica, ejecuta las
   acciones existentes, registra resultado o fallo y es idempotente:
   cumplido, con observaciones.**
   - Claim `updateMany` con `actorId`; zod y precondiciones contra una
     lectura fresca; las cuatro acciones existentes; CONFIRMED o FAILED con
     auditoría.
   - Repetir devuelve el estado guardado. Lo probó el implementador con la
     confirmación repetida y con el duplicado en paralelo.
   - La re-validación no es atómica con la escritura (hallazgo 2) y falla con
     IVA 0 (hallazgo 1).
4. **Rechazo, vencimiento a 24 horas y auditoría: cumplido.**
   - El rechazo es condicional.
   - El TTL es de 24 h, con el borde probado.
   - Queda EXPIRED al intentar confirmar o rechazar una vencida, y
     `discarded` al regenerar.
   - Los eventos `proposal.*` están en la base.
5. **Checks, TypeScript, lint y build registrados: cumplido.** Están en
   `progress/impl_agent_proposals.md` y los re-corrí todos.

## Evidencia de la prueba autenticada del implementador

- Alcanza para: crear desde el formulario sin guardar, guardar el margen con
  precios iguales a la tarjeta, fallar por presupuesto cambiado (secuencial),
  confirmar repetido y duplicar en paralelo sin doble escritura, rechazar
  idempotente, vencer por TTL, vencer al regenerar y auditar. Los conteos de
  la base coinciden con lo que reporta.
- Falta, sin bloquear y sin OpenAI (se puede hacer llamando las acciones):
  - Confirmar con éxito una publicación: el mapeo de éxito de `execute` para
    `PUBLISH_OFFICIAL_BUDGET` nunca corrió contra la base.
  - Guardar un presupuesto vinculado a un oficial ACTIVE, con la versión N+1
    automática y `result.officialVersion`.
  - Una propuesta vieja por un vínculo oficial publicado en el medio (solo
    está la prueba unitaria).
  - Categorías conservadas al guardar un presupuesto que tenga categorías.
  - Dos confirmaciones concurrentes de propuestas distintas del mismo
    presupuesto (hallazgo 2).
  - 403 para quien no es admin (no hay usuario).

## Para aprobar

- **Obligatorio:** el hallazgo 1, con el guard de IVA en el camino de las
  propuestas y su aserción en `check:agent-proposals`.
- **Recomendado en la misma pasada, porque son chicos:** 3, 5 y 7.
- **A decidir:** el 2 se arregla ahora (`expectedUpdatedAt` en `updateBudget`)
  o queda como requisito explícito de la 41.

## Re-revisión (b6becae)

**Veredicto: APPROVED.**

Revisé `git show b6becae` en lo que toca a la 40 y la sección "Correcciones
de la revisión" de `progress/impl_agent_proposals.md`. Esa sección está en el
árbol de trabajo, sin commitear. HEAD sigue en `b6becae`. Volví a correr
todos los checks y el build, y comprobé con scripts puros (sin base) lo que
se guardaría contra lo que muestra la tarjeta.

El bloqueante quedó resuelto y probado, y seis de los siete menores también.
El único que queda sin cambio de código es el 8, anotado para la 41. Lo que
sigue abierto (abajo) es menor y no afecta lo que se guarda en el caso
normal.

### Qué quedó resuelto

1. **IVA 0 (bloqueante): resuelto.**
   - El IVA 0 se corta en tres capas:
     - La entrada de las tools rechaza `iva <= 0` (`schemas/agent-tools.ts:37-43`).
     - Toda base parte del IVA efectivo: `withEffectiveIva` en
       `budgetOptionToFormValues` (`lib/agent/budget-calculation.ts:27-28,36`)
       y en el formulario (`lib/agent/context.ts:65`, con una nota para el
       modelo).
     - El payload exige `iva` positivo (`schemas/agent-proposals.ts:14`), al
       proponer y otra vez al confirmar.
   - Scripts puros sobre el fixture:
     - La entrada rechaza IVA 0 y −1 y acepta 10.
     - Un IVA 0 que llegue directo a los builders (en `changes`, en los
       valores por defecto o en un formulario crudo) termina en
       `invalid_values`.
     - Con margen 40, la tarjeta da $ 8.567,63 y $ 9.489,95, y se guardaría
       8.567,6297 y 9.489,95.
     - Con IVA 10, la tarjeta da $ 8.000,80 y $ 8.832,40, y se guardaría
       8.000,8017 y 8.832,40.
     - Todos los payloads se vuelven a parsear como al confirmar.
   - Las aserciones nuevas fallarían si se revierte:
     `scripts/check-agent-proposals.ts:124-126`.
2. **Carrera entre la re-validación y la escritura: resuelto para guardar
   cambios.**
   - `updateBudget` acepta `expectedUpdatedAt` y lo compara dentro de su
     transacción (`actions/budgets/update-budget.ts:11-18,89-98`). Lo compara
     antes de borrar o recrear opciones y antes de publicar la versión
     oficial. Si no coincide, lanza `BudgetChangedError`, que vuelve como
     `{ error }` (`:193`).
   - Confirmar lo pasa (`actions/agent/confirm-proposal.ts:70-78`) y
     `failure` lo informa como propuesta vieja (`:50-58`).
   - El formulario no cambia: su única llamada
     (`components/budgets/actions/update-budget.action.ts:7`) sigue con tres
     argumentos.
   - Lo cubren los checks de fuente (`scripts/agent-proposal-source-checks.ts:43,46-47`).
3. **La tarjeta sale de la fila guardada: resuelto.**
   - `kind` y `summary` salen de la fila guardada, y los importes citables de
     ese resumen (`lib/agent/tools/proposals.ts:37-58`,
     `lib/agent/proposal-summary.ts:70`).
   - El conjunto de importes citables es el mismo que antes (lo comparé).
4. **EXECUTING y auditoría: resuelto en lo que pedía la revisión.**
   - Se audita antes de cerrar la propuesta.
   - El cierre es condicional (`updateMany where { id, status: "EXECUTING" }`).
   - Si borraron la conversación en el medio, responde con el resultado de la
     escritura (`actions/agent/confirm-proposal.ts:163-188`).
   - Lo cubre `scripts/agent-proposal-source-checks.ts:50`.
   - Mostrar una EXECUTING vieja como resultado desconocido quedó como
     requisito de la 41.
5. **Vencimiento al regenerar: resuelto.** Actualiza propuesta por propuesta
   y audita solo con `count` 1 (`lib/agent/proposal-store.ts:117-122`). Lo
   cubre `scripts/agent-proposal-source-checks.ts:24`.
6. **Slug de duplicar: resuelto.** La tarjeta deja `slug: null`
   (`lib/agent/stored-budget-proposals.ts:40`) y la dirección real llega en
   `result` (`scripts/check-agent-proposals.ts:100`).
7. **Resultado con el oficial vinculado: resuelto.** `result` trae
   `officialBudgetId` y `officialVersion`
   (`actions/agent/confirm-proposal.ts:36-46,76`;
   `scripts/agent-proposal-source-checks.ts:44`).
8. **Trabajos vinculados:** sin cambio de código, anotado para la 41, como se
   pidió.

### Qué no quedó resuelto (no bloquea)

- **El vínculo oficial se sigue re-validando fuera de la transacción.**
  - **Qué pasa.** Publicar como oficial no cambia `Budget.updatedAt`:
    `publishOfficialBudgetInTransaction` hace `SELECT … FOR UPDATE` y crea el
    `OfficialBudget`, y la FK vive en el oficial
    (`lib/official-budgets/versioning.ts:17-19,46-59`). Por eso el
    compare-and-set no ve una publicación que entre entre
    `getAgentBudgetState` (`actions/agent/confirm-proposal.ts:118`) y la
    transacción.
  - **Qué puede salir mal.** En esa ventana de milisegundos, guardar cambios
    de un presupuesto que no era oficial publicaría la versión 2 sin que la
    tarjeta lo anunciara.
  - **Sugerencia.** Dentro de la transacción, después del compare-and-set,
    comparar el oficial vinculado con el esperado (por ejemplo, un
    `expectedOfficialBudgetId`). La fila ya está tomada y publicar necesita
    `FOR UPDATE`, así que no se puede intercalar. Una publicación ya
    commiteada la ve la sentencia siguiente (READ COMMITTED).
- **Publicar y duplicar siguen con la ventana no atómica que ya estaba
  anotada.** Por ejemplo, una publicación confirmada podría tomar valores
  guardados en el medio por otra confirmación, distintos de los de su
  tarjeta. Si se quiere cerrar, se puede comparar `updatedAt` después del
  `FOR UPDATE` de `loadGeneratorBudget`.
- **Detalle: el arreglo 3 no tiene aserción.** Si `saveProposal` volviera a
  usar `built.summary` y `built.kind`, ningún check fallaría.
- **Detalle: el cambio de IVA de un presupuesto guardado con IVA 0 no se
  lista.** Hoy no hay ninguno (las 331 opciones tienen IVA 22). Guardarlo
  desde el agente lo pasaría a IVA 22 sin que `changes` lo diga. Sí aparece
  el aviso de "precios guardados que no salen del cálculo" y se guarda lo de
  la tarjeta (lo comprobé con un script).
- **Detalle: la respuesta de confirmar tiene otra forma si la fila
  desapareció.** Devuelve `{ success, result }`, sin `proposal`
  (`actions/agent/confirm-proposal.ts:185-187`). El wrapper de la 41 tiene
  que aceptar las dos formas.

### ¿Alcanza la evidencia sin una carrera real contra la base?

Sí, para aprobar:

- **Semántica.** En Postgres (READ COMMITTED, el nivel por defecto, que
  Prisma no cambia), el
  `UPDATE … WHERE id AND "updatedAt"` toma la fila dentro de la transacción.
  Una escritura que compite espera y, cuando la primera commitea, reevalúa el
  `WHERE` sobre la versión nueva y da 0 filas. Toda escritura de `Budget`
  cambia `updatedAt` (`tx.budget.update` con `@updatedAt`), y el borrado
  elimina la fila. Resultado: `BudgetChangedError`, rollback y nada escrito.
- **Mismo mecanismo que el claim.** Es el `updateMany` condicional que usa el
  claim de confirmar, y ese sí se probó de verdad con dos confirmaciones en
  paralelo: ejecutó una sola.
- **Riesgo que queda.** Que Prisma no emita un único `UPDATE` con el filtro.
  El claim y `appendLinkedOfficialBudgetVersion` ya dependen de eso.
- **Recomendado, sin bloquear.** Cuando se permitan escrituras, un smoke
  sobre un presupuesto de prueba:
  - Dos `updateBudget(…, { expectedUpdatedAt })` concurrentes: uno guarda y
    el otro devuelve `BUDGET_CHANGED_MESSAGE`.
  - Confirmar sobre una base vieja: termina FAILED sin tocar opciones.

### Checkpoints (re-revisión)

- **C1: [x]** `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35). `progress/current.md` y
  `feature_list.json` los maneja el líder.
- **C3: [x]**
  - `lib/budget-errors.ts` es un helper de `lib/`.
  - El cambio de `updateBudget` es compatible hacia atrás.
  - Las escrituras siguen por `actions/` y las lecturas por `data/`.
  - Todos los archivos tienen 200 líneas o menos. El más largo es
    `scripts/check-ai-gateway.ts`, de la 38, con 199; después vienen
    `actions/budgets/update-budget.ts` y `lib/agent/budget-calculation.ts`,
    con 197, y `actions/agent/confirm-proposal.ts`, con 195.
- **C4: [x]** Pasan el harness, lint, `prisma validate`, `tsc` y
  `next build`.
- **C5: [x]** `b6becae` no agrega `console.log`, `debugger` ni TODO.

### Evidencia (HEAD `b6becae`)

- `.\init.ps1`: **pass**, exit 0. Harness con 41 features y una
  `in_progress`, `prisma validate` y ESLint.
- `pnpm exec tsc --noEmit --incremental false`: **pass**, exit 0 (11 s).
- `pnpm check:agent-proposals`: **pass**.
- `pnpm check:agent-tools`: **pass**. Ahora incluye
  `scripts/agent-input-checks.ts`.
- `pnpm check:official-budgets`: **pass**.
- `pnpm check:official-budget-workspace`: **pass**.
- `pnpm exec next build` sobre HEAD `b6becae`
  (`b6becae4bd662baba73582cf00b018358fc4b2a6`): **pass**, exit 0. Cubre las
  features 38, 39 y 40. Compiló en 7,2 s, pasó TypeScript, generó 29 páginas
  estáticas y listó 38 rutas, entre ellas `ƒ /api/agent/chat`. Tardó 26,9 s
  en total.
- Scripts puros del revisor en el scratchpad (tarjeta contra lo guardado,
  IVA 0 guardado, importes citables): **pass**. Los resultados están arriba.
- `prisma migrate status`: no hizo falta repetirlo, porque `b6becae` no toca
  `prisma/`.
- Mutaciones: no las corrí, porque no puedo editar código. En cambio verifiqué
  leyendo que cada aserción nueva falla si se revierte su arreglo. La única
  excepción es el arreglo 3, que no tiene aserción.
