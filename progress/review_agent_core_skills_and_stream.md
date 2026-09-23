# Review - agent_core_skills_and_stream

**Verdict:** APPROVED

La re-revisión del commit `b6becae` aprueba la feature. Está al final, en
"Re-revisión (b6becae)". Todo lo que viene antes es la primera revisión
(CHANGES_REQUESTED sobre `113a6ea`) y queda como historia.

Alcance: feature 39, commits `d6cb32f` (código) y `113a6ea` (docs), rango
`9d3fb00..113a6ea`. Las líneas citadas son de `113a6ea`. HEAD (`a63a8b0`) se
usó para verificar la integración con la 40.

## Findings

Hay un bloqueante: un bug de cálculo que va contra la regla de precios, que
es el centro de la feature. Los ocho criterios de aceptación se cumplen
tal como están escritos y todos los checks pasan. El arreglo es chico y
va en archivos de la 39. Conviene resolver también los menores 2 a 4 antes
de la 41, porque la tarjeta de email, el historial y el diálogo de costos
los van a mostrar.

### Bloqueante

1. **`calculateBudget` acepta IVA 0, lo da por aplicado y calcula con 22 %.**
   - Cómo pasa, paso a paso:
     - `schemas/agent-tools.ts:37` (`iva: z.number().min(0)`) deja pasar 0.
     - `applyBudgetChanges` lo copia y `changedFields` lo marca como cambiado
       (`lib/agent/budget-calculation.ts:152-153` y `:165`).
     - `describeBudgetInputs` devuelve `ivaPercent: 0` (`:130`).
     - Pero `runBudgetCalculation` pasa por `calculateBudgetTotals`, que
       convierte el 0 en 22 (`lib/budget-calculations.ts:106`,
       `Number(values.iva) || 22`), y devuelve `ivaPercent: 22` (`:78`).
   - Reproducción (script puro sobre los valores por defecto, sin base):
     - el schema acepta `iva: 0`;
     - `changedFields` es `["iva"]`;
     - `inputs.ivaPercent` es 0 y `calculation.ivaPercent` es 22;
     - los totales son idénticos a los de 22 % (sin productos: neto
       $ 7.273,46, IVA $ 1.600,16, final $ 8.873,62);
     - esos importes quedan en la lista de citables.
   - Por qué importa:
     - La tool rompe su propio contrato: su descripción dice que
       "changedFields dice qué cambió de verdad".
     - El agente recibe como "final con IVA 0" un importe que incluye el
       22 %. Como sale de un cálculo, el grounding lo da por bueno y
       `draftEmail` lo acepta: la regla de precios no puede atajar un importe
       mal rotulado en su fuente.
     - El pedido es natural en este negocio: la nota de Literal E dice que
       se aplica el monto sin IVA, así que "calculalo sin IVA" o "con IVA 0"
       es esperable, y la instrucción de la tool ("null salvo lo que el
       usuario pidió cambiar") empuja al modelo a mandar `iva: 0`.
   - La misma entrada existe por el contexto `form`: el formulario acepta
     IVA 0 (`schemas/BudgetSchema.ts:36`). Con eso,
     `getStoredOptionAmounts` (`lib/agent/context.ts:69`) y
     `formatBudgetForAI` presentan como "sin IVA" un precio calculado con
     22 %.
   - Contexto:
     - El `|| 22` es anterior a la 39 y el formulario manual lo comparte;
       arreglar el formulario queda fuera de alcance.
     - Lo que agrega la 39 es la entrada: acepta 0 y lo presenta como
       aplicado.
     - `budgetChangesSchema` también lo usan `proposeCreateBudget` y
       `proposeUpdateBudget` (`schemas/agent-tools.ts` en HEAD). Es la misma
       causa que la revisión de la 40 marca como bloqueante
       (`progress/review_agent_proposals.md`).
   - Arreglo mínimo:
     - rechazar `iva <= 0` con un mensaje claro en `budgetChangesSchema`
       (por ejemplo `z.number().positive()`), así queda cubierto para
       `calculateBudget`, `solveForTargetPrice` y las dos `propose*` que
       reciben `changes`;
     - en `resolveBudgetContext`, normalizar el IVA 0 del contexto `form`
       al que de verdad usa el cálculo, o rechazarlo;
     - sumar una aserción en `check:agent-tools`.

### Menores

2. **`draftEmail` devuelve como fuentes todos los oficiales de la conversación, no los que usó el borrador.**
   - Dónde: `lib/agent/tools/email.ts:31` toma `ctx.grounding.evidence`
     completo. Lo pasa al prompt de redacción (`lib/agent/email-prompt.ts:73-77`)
     y lo devuelve como `sources` (`email.ts:68-73`).
   - Qué pasa: un correo con importes calculados, o sobre otro servicio, sale
     con fuentes oficiales que no usó, y la tarjeta de la 41 las va a mostrar
     como respaldo del precio. Los importes igual están validados, así que
     ningún precio sale sin fuente. Lo que queda impreciso es la trazabilidad
     que pide el criterio ("records official sources").
   - Arreglo: devolver solo las fuentes con algún precio en
     `check.quotedAmounts`.

3. **El top 10 del mes pone primero las conversaciones sin precio.**
   - Dónde: `data/agent/usage.ts:117` ordena por `_sum.costUsd` descendente.
   - Qué pasa: PostgreSQL pone los `NULL` primero en `DESC`. Una conversación
     que solo usó modelos sin precio (suma `NULL`) desplaza a las que más
     gastaron.
   - Hoy los tres modelos tienen precio, así que solo aparece con un modelo
     del gateway sin `AI_PRICE_*`. Lo usa la 41 en el diálogo de costos.
   - Arreglo: `nulls: "last"`, o excluir las sumas nulas.

4. **Reenviar un id que ya existe no compara el rol ni el texto.**
   - Dónde: `lib/agent/conversation-store.ts:82-83` y `lib/agent/turn.ts:53-61`.
   - Qué pasa: `saveUserMessage` acepta cualquier fila de la conversación con
     ese id como si fuera el mismo mensaje del usuario. Después el turno borra
     todo lo posterior y responde con el texto guardado. `trigger` y
     `messageId` se validan (`schemas/agent.ts:47-48`), pero nadie los usa.
   - Efecto (a): el flujo de edición del SDK (`sendMessage({ text, messageId })`)
     respondería el texto viejo y descartaría lo posterior sin avisar.
   - Efecto (b): si llega el id de un mensaje del asistente, el turno pasa a
     ser una continuación. Su respuesta no se puede guardar, porque el
     `create` de `conversation-store.ts:125` choca con la PK y el error solo
     queda en el log (`turn.ts:119-121`). El consumo, en cambio, sí se cobra
     y se registra.
   - Por qué es menor: ningún flujo previsto de la UI llega a esto. Reintentar
     y regenerar reenvían el mismo mensaje del usuario sin cambios, y eso
     funciona bien.
   - Arreglo: si la fila existe, exigir `role: USER` y el mismo texto, o
     devolver 409.

5. **Dos acciones de lectura no llaman al guard ellas mismas.**
   - Dónde: `listAgentConversations` y `getAgentConversationAction`
     (`actions/agent/conversations.ts:29-33` y `47-51`).
   - Qué pasa: validan la entrada antes de autenticar y dejan el guard a
     `data/agent/conversations.ts`. En la práctica están protegidas: el guard
     corre antes de cualquier lectura y `AdminAuthorizationError` vuelve como
     `{ error }`. Pero `docs/architecture.md` pide `auth()` primero, y las
     otras tres acciones del mismo archivo lo hacen.
   - Relacionado: `data/agent/knowledge.ts:17` no tiene guard. Hoy solo se
     llama después del de la ruta.

6. **`toPlainJson` no lo usa ninguna tool.**
   - Dónde: `lib/agent/tool-result.ts:27-45`. Solo se ejecuta en el check
     (`scripts/check-agent-tools.ts:179-190`).
   - Qué pasa: las salidas no tienen `Decimal` porque cada tool convierte a
     mano con `Number()` o `roundMoney` (lo revisé tool por tool). El check
     prueba el helper, no una salida real, así que no cubre el criterio.
   - Arreglo: aplicarlo en `runTool`/`toolOk`, o sacarlo y validar una salida
     real.

7. **`lib/` importa de `components/`.**
   - Dónde: `lib/agent/tools/finance.ts:5`, `lib/agent/tools/payroll.ts:5-8`
     y `lib/agent/tools/official-budgets.ts:5-8`. Este último importa un
     módulo `"use server"` de wrappers.
   - Qué pasa: son los primeros imports de `lib/` hacia `components/`, y eso
     invierte las capas de `docs/architecture.md`.
   - No lo tomo como violación: el plan aprobado nombra esas funciones para
     que el agente dé los mismos números que la pantalla.
   - Seguimiento: mover esos helpers puros a `lib/`.

8. **El consumo se guarda solo en `onEnd`.**
   - Dónde: `lib/agent/run.ts:62-68` junta el uso de cada paso en memoria y
     `lib/agent/turn.ts:89-105` lo guarda al final.
   - Lo que funciona: con un modelo simulado comprobé que `onEnd` corre al
     detener (señal) y al cortar el body (desconexión), con el uso de los
     pasos terminados (ver Evidence).
   - Hueco (a): si Vercel corta la función por `maxDuration`
     (`app/api/agent/chat/route.ts:18`, 60 s), no hay `onEnd`. Se pierde el
     consumo ya pagado y el mensaje del usuario queda sin respuesta. El turno
     más largo medido fue de 38,9 s, y Bajo con xhigh puede pasarse.
   - Hueco (b): la escritura que corre después de una desconexión no está
     registrada con `after()`/`waitUntil`, así que en producción no está
     garantizado que termine.
   - Límite propio del proveedor: el paso cortado no se puede registrar,
     porque no informa su uso.
   - Sugerencia: guardar el uso por paso en `onStepEnd` y cerrar la decisión
     pendiente de `maxDuration`.

9. **Evidencia: el 403 de la ruta nunca se ejecutó.**
   - Qué pasa: el 307 del reporte lo devuelve `proxy.ts:31-33` a quien no tiene
     sesión. Un usuario logueado que no es admin pasa el proxy, y recién ahí
     `app/api/agent/chat/route.ts:26-30` devuelve 403.
   - Por lectura el código es correcto: `requireAdminSession` lanza si
     `role !== "ADMIN"` y la ruta responde 403 antes de leer el body. El check
     solo verifica que el nombre aparezca en el archivo.
   - Pedido: cubrirlo en el smoke de la 41 con un usuario que no sea admin.

### Detalles

- `app/api/agent/chat/route.ts:55-64`: el título se agenda solo si
  `runAgentTurn` no lanza. Si el primer turno falla (por ejemplo, sin
  `OPENAI_API_KEY`), el reintento ya no cuenta como conversación creada y
  queda el título de respaldo. Además, `lib/agent/conversation-title.ts:64-67`
  pisa sin condición un renombrado hecho mientras corría el primer turno.
- `lib/agent/tools/operations.ts:80-88`: `visits` lee todo el mes con el
  include completo y recién después recorta a 50.

### Revisado sin hallazgos

- **Pertenencia:**
  - la ruta decide el 409 por un mensaje ajeno antes de tocar nada;
  - `claimAgentConversation` crea o toma la conversación solo con `userId`;
  - el historial se lee después de ese claim;
  - lecturas, renombrar, borrar, modo y costo filtran por usuario;
  - el informe mensual oculta los títulos ajenos.
- **Historial:** el cliente no puede inyectar historial. El schema solo
  acepta partes de texto y el historial sale de la base.
- **Reintento y regenerar:** son idempotentes para el mismo mensaje del
  usuario y descartan lo que vino después.
- **Importes (fuera del caso de IVA 0):** `getStoredOptionAmounts` usa la
  misma aritmética que `formatBudgetForAI` y que `createBudget` (el precio
  guardado es el final con IVA). La evidencia se rearma solo con partes
  `output-available` y `ok: true`.
- **Validación del borrador:** `validateEmailDraft` cubre los cuatro casos. La
  nota de Literal E es la misma que la de `data/ai-system-message.ts:58`.
- **Tools sin escrituras:** todas las lecturas que usan (`data/ops/*`,
  `data/budget*`, oficiales, `lib/official-budgets/search.ts`) son de solo
  lectura. `getOpsCostSettings` ya usa `findUnique`, y las visitas pasan por
  `data/agent/occurrences.ts` con los mismos filtros que Finanzas → Pagos.
- **Integración con la 40:** cambió `turn.ts`, `system-prompt.ts`,
  `tools/context.ts`, las habilidades, `tool-catalog.ts`, `tools/index.ts`,
  exports de `budget-calculation.ts` y un comentario de
  `agent-source-checks.ts`. No rompió nada de la 39: `tsc` y
  `check:agent-tools` pasan en HEAD con las 18 tools.

## Checkpoints

- C1: [x] Harness completo y `.\init.ps1` sale con 0.
- C2: [x] Una sola feature `in_progress` (la 35) y estados válidos. La 39
  sigue `pending` a la espera de esta revisión, como explica
  `progress/current.md`.
- C3: [x] Se cumplen los límites de arquitectura:
  - la excepción de la ruta está documentada en `docs/architecture.md`;
  - las mutaciones de conversaciones están en `actions/`, las lecturas en
    `data/agent/**` y el zod en `schemas/agent*.ts`;
  - la persistencia del turno vive en `lib/agent/*-store.ts`, igual que en
    `lib/mail-agent/**`;
  - hay guard en la ruta y en cada acción, aunque en dos es indirecto
    (hallazgo 5);
  - los imports `lib → components` los aprobó el plan (hallazgo 7).
- C4: [x] Corrí harness, lint, `prisma validate`, `tsc`, los checks y el
  estado de migraciones. El `next build` de HEAD, que incluye este código,
  pasa según `progress/review_agent_proposals.md`. Esta feature no tiene UI.
- C5: [x] No hay archivos temporales, `debugger` ni TODO en el rango. El único
  `console.log` es el mensaje final del check, como en los demás scripts. Los
  otros archivos sin trackear en `progress/` son de las revisiones paralelas
  de la 38 y la 40.

## Evidence

- `.\init.ps1` (HEAD `a63a8b0`): pass. Harness OK (1 `in_progress`, 41
  features), `prisma validate` OK, ESLint completo OK.
- `pnpm exec tsc --noEmit --incremental false` (HEAD): pass (exit 0).
- `pnpm check:agent-tools` (HEAD): pass.
- `pnpm check:finance`, `pnpm check:finance-trend`,
  `pnpm check:official-budgets`, `pnpm check:mail-agent` (HEAD): pass.
- `pnpm check:ai-gateway` (HEAD, adicional): pass.
- `pnpm exec prisma migrate status`: pass ("21 migrations found... Database
  schema is up to date!").
- Consulta de solo lectura a la base:
  - `_prisma_migrations`: `20260918120000_agent_workspace` terminada, sin
    rollback, 1 paso.
  - FKs: `AgentConversation.userId` CASCADE, `AgentConversation.budgetId` SET
    NULL, `AgentMessage.conversationId` CASCADE,
    `AgentUsageEvent.conversationId` SET NULL, `AgentAuditEvent.actorId` SET
    NULL.
  - Filas: `Chat` sigue con 17; hay 0 conversaciones y 30 eventos de consumo
    sin conversación (las pruebas de la 39 y la 40).
- Snapshot exacto de `113a6ea` (`git archive` en el scratchpad, con el
  `node_modules` del repo): `tsc --noEmit` pass, `check-agent-tools.ts` pass
  y ESLint de los 46 archivos TS del rango pass. Así la 39 queda verificada
  sola, no solo encima de la 40.
- Script puro del bloqueante 1 (sin base; la lógica de
  `budget-calculation.ts` y el `iva` del schema son iguales en `113a6ea` y en
  HEAD): con `iva: 0`, `changedFields: ["iva"]`, `inputs.ivaPercent: 0`,
  `calculation.ivaPercent: 22` y totales idénticos a los de 22 %.
- Simulación sin red, sin base y sin servidor. Usé `MockLanguageModelV4` de
  `ai/test` con la misma composición que la ruta sobre `ai@7.0.105`:
  - turno completo: `onEnd` recibe el uso de los dos pasos, y el metadata del
    `finish` ya lo trae;
  - Stop por señal: `onEnd` corre con `isAborted: true` y el uso del paso
    terminado;
  - corte del body: `onEnd` también corre, por el `cancel()` del último
    transformador, con el uso del paso terminado.
- Código de `@ai-sdk/openai`: con `store: false` y un modelo de razonamiento,
  el proveedor pide `reasoning.encrypted_content` por su cuenta. Por eso las
  partes de razonamiento guardadas se pueden reenviar al turno siguiente.
- Tamaño: los 46 archivos TS del rango tienen 200 líneas o menos (el mayor
  es `scripts/check-agent-tools.ts`, con 192), y la migración tiene 116.
  `schema.prisma` está exento. `docs/agent-plan.md` (564) y
  `progress/current.md` (275) ya pasaban de 200 antes de la 39 (536 y 249);
  son documentos vivos a los que la feature solo sumó secciones.
- `next build` / `pnpm build`: no los corrí, por indicación del líder. El
  build de HEAD `a63a8b0`, que incluye este código, pasa según
  `progress/review_agent_proposals.md`. El implementador registró
  `pnpm exec next build` PASS (38 rutas) en su commit.
- Prueba autenticada con OpenAI: no la repetí.
  - La evidencia del implementador alcanza para las tres habilidades, Alto
    con Sol, el formulario sin guardar, el corte, regenerar, 409, 400,
    títulos, historial, costos y acciones.
  - Falta el 403 de un usuario logueado que no es admin (hallazgo 9). El
    error sin `OPENAI_API_KEY` queda cubierto por lectura: `resolveLanguageModel`
    lanza antes del stream, la ruta responde 500 con el mensaje de
    configuración, y `check:ai-gateway` y `check:agent-tools` lo prueban.

## Criterios de aceptación

1. **Migración aditiva sin tocar `Chat`/`Message`: cumplido.** Los cuatro
   modelos entran en `20260918120000_agent_workspace` con enums, índices y
   FKs, sin `ALTER` ni `DROP` sobre otras tablas. El check y la base lo
   confirman (17 chats intactos).
2. **Perfil del negocio y conocimiento aprobado: cumplido.**
   `lib/agent/business-profile.ts` junta los datos de contacto, IVA 22, la
   frase de Literal E, BPS, 4,32 y transporte, importando las constantes
   existentes. El check asserta que coinciden. `data/agent/knowledge.ts` lee
   `MailMemory` aprobada de organización, políticas y estilo, sin contactos,
   con tope de 30, y entra al prompt como solo lectura.
3. **Habilidades: cumplido.** Presupuestos, Emails y Consejos traen
   instrucciones, tools permitidas y sugerencias. General expone todas; el
   check lo prueba y `getBusinessProfile` está siempre.
4. **Prompt: cumplido.** Está en español con voseo, incluye la nota de
   Literal E textual, la regla de precios que prohíbe citar importes sin
   fuente oficial exact, presupuesto o cálculo, y el contexto del
   presupuesto. El check lo verifica. Con IVA 0 la fuente misma sale mal
   rotulada (bloqueante 1).
5. **Tools de lectura y cálculo: cumplido en su letra.**
   - Usan las lecturas de `data/` y las fórmulas de
     `lib/budget-calculations.ts`, heredando también su `|| 22`.
   - Devuelven `{ ok, data } | { ok: false, error }` a través de `runTool`.
   - Las salidas no tienen `Decimal` (conversión manual, hallazgo 6).
   - No escriben filas operativas: las visitas se leen sin generarse.
   - La incoherencia de `calculateBudget` con IVA 0 es el bloqueante 1.
6. **`draftEmail`: cumplido.** Redacta con el modelo del modo, rechaza
   `ungrounded_price`, `price_mismatch` y `missing_literal_e`, suma su
   consumo como `SKILL` y registra fuentes. Las fuentes son demasiado amplias
   (hallazgo 2).
7. **Ruta `/api/agent/chat`: cumplido.** Pide sesión de admin (403 JSON,
   correcto por lectura; falta ejecutarlo, hallazgo 9). Valida modo,
   habilidad y body con zod. En `onEnd` guarda el `UIMessage` con sus partes
   y los eventos de consumo con costo estimado, también si el turno se corta.
   La ruta se mantiene fina (94 líneas, lógica en `lib/agent/`).
8. **Verificación registrada: cumplido.** Hay checks de tools, habilidades y
   prompt, `prisma validate`, verificación de la migración, `tsc`, lint y
   build (el del implementador en su commit y el de HEAD en la revisión de la
   40).

## Para aprobar

- Resolver el bloqueante 1 (rechazo de IVA ≤ 0 en `budgetChangesSchema`,
  contexto `form` coherente y aserción en `check:agent-tools`) y volver a
  correr `check:agent-tools`, `check:agent-proposals`, `tsc` y
  `.\init.ps1`.
- Los menores no bloquean. Conviene cerrar 2, 3 y 4 antes de la 41.

## Re-revisión (b6becae)

**Verdict:** APPROVED

Revisé `git show b6becae` en los archivos de la 39 y la sección
"Correcciones de la revisión" de `progress/impl_agent_core_skills_and_stream.md`
(en el árbol de trabajo, sin commitear). HEAD sigue en `b6becae` y el árbol
no tiene cambios de código. Las líneas citadas en esta sección son de
`b6becae`.

El bloqueante está resuelto y verificado por separado. De los ocho menores,
cinco quedaron resueltos y tres se postergaron con registro en la
documentación, lo que acepto porque ninguno era bloqueante. Los checks,
`tsc`, `.\init.ps1` y el build de HEAD están en verde. Quedan cuatro puntos
menores nuevos, ninguno bloqueante.

### Resuelto

1. **Bloqueante: IVA 0.**
   - `budgetChangesSchema.iva` ahora es `.positive(...)`
     (`schemas/agent-tools.ts:39-43`), con un mensaje que manda a usar los
     importes sin IVA del cálculo. Cubre `calculateBudget`,
     `solveForTargetPrice` y las dos `propose*` que reciben `changes`.
   - `withEffectiveIva` (`lib/agent/budget-calculation.ts:27-28`) se aplica
     en `budgetOptionToFormValues` (`:36`) y en el contexto `form`
     (`lib/agent/context.ts:63-74`). Este último avisa en su texto cuando
     corrige el IVA.
   - Reproducción independiente (script puro, sin base):
     - `iva: 0` se rechaza en `calculateBudget` y en `solveForTargetPrice`,
       con el mensaje nuevo;
     - un guardado con IVA 0 da insumos y cálculo en 22;
     - un cambio legítimo a 10 sigue funcionando (`changedFields: ["iva"]`,
       cálculo con 10);
     - el formulario con IVA 0 pasa a 22, con aviso en el texto, y el neto
       citable es igual al precio / 1,22.
   - En el SDK, un input inválido vuelve al modelo como `tool-error` con el
     mensaje (`ai/src/generate-text/stream-language-model-call.ts:696-711`): el turno no se
     corta y el modelo puede corregirse.
2. **Fuentes de `draftEmail`:** `selectQuotedSources` (`lib/agent/grounding.ts:67-72`)
   se usa en `lib/agent/tools/email.ts:68`. El prompt de redacción sigue
   recibiendo todas las fuentes, pero la tarjeta muestra solo las citadas.
3. **Top 10 del mes:** `costUsd: { not: null }` en el `where`
   (`data/agent/usage.ts:118`). El uso sin precio lo cuenta
   `unpricedEvents`, como dice `docs/agent.md`.
4. **Reenvío de un id:** `saveUserMessage` exige rol USER y el mismo texto, y
   si no devuelve un 409 con mensaje propio
   (`lib/agent/conversation-store.ts:89-95`). Tomar
   `getMessageText` de las partes ya recortadas por zod hace que la
   comparación sea estable al regenerar.
5. **Guards primero:** `listAgentConversations` y
   `getAgentConversationAction` llaman a `requireAdminSession()` antes de
   validar (`actions/agent/conversations.ts:31` y `:50`), y
   `getApprovedAgentKnowledge` tiene su propio guard
   (`data/agent/knowledge.ts:19`).
6. **JSON plano en tiempo de ejecución:** `runTool` pasa cada salida por
   `toPlainResult` (`lib/agent/tool-result.ts:51-52` y `:61`).
   `getBusinessProfile` no pasa por `runTool`, pero su salida ya es JSON
   plano.
7. **Título (detalle):** el título del modelo solo pisa el que tenía la
   conversación al empezar el turno (`lib/agent/conversation-title.ts:67`) y
   se genera mientras no haya respuesta, así también se genera al reintentar
   un primer turno que falló (`lib/agent/turn.ts:84`).

### Postergado, con registro

- **Imports de `lib/` a `components/` (menor 7):** siguen. Quedan como
  seguimiento en `docs/agent-plan.md` ("Correcciones de las revisiones").
- **Consumo guardado solo en `onEnd` (menor 8):** sigue. `docs/agent.md` ya
  dice que un corte por `maxDuration` pierde el consumo de ese turno, y lo
  deja como decisión pendiente junto con el valor de `maxDuration`.
- **403 de un usuario que no es admin (menor 9):** queda para el smoke de la
  41. Por lectura el código es correcto.
- **Recorte de visitas antes de leer (detalle):** sin cambios.

### Menores nuevos (no bloquean)

1. **Los checks no cubren cuatro de los arreglos.** Mutaciones de a una sobre
   una copia de `b6becae` en el scratchpad, corriendo
   `check-agent-tools.ts`:
   - Detectadas (7): IVA `.positive` → `.min(0)`, base guardada sin
     `withEffectiveIva`, formulario sin IVA efectivo, `runTool` sin
     `toPlainResult`, reenvío sin comparar texto, título que pisa un
     renombrado y top 10 con uso sin precio.
   - No detectadas (4):
     - el punto de llamada de `selectQuotedSources` en `tools/email.ts`
       (solo se prueba la función suelta);
     - el guard de `listAgentConversations`;
     - el guard de `getApprovedAgentKnowledge`;
     - `needsTitle` vuelto a "solo al crear".
   - El "8 de 8" del implementador es sobre su propia selección. En la mía,
     el check detecta 7 de 11, y esos cuatro arreglos podrían revertirse
     sin que nada falle.
   - Sugerencia: una aserción de texto por cada uno, igual que las que ya
     están en `scripts/agent-input-checks.ts`.
2. **Regenerar la primera respuesta puede pisar un renombrado.**
   - Cómo pasa: `needsTitle` se mira después de `discardMessagesAfter`
     (`lib/agent/turn.ts:84`). Si el usuario renombra la conversación y
     después regenera la primera respuesta, el turno ya no tiene respuesta
     del asistente, `replaceTitle` es el nombre elegido por el usuario, y el
     título del modelo lo reemplaza. Lo mismo pasa si renombra entre un
     primer turno fallido y el reintento.
   - `docs/agent.md` dice "un renombrado gana": vale para un renombrado
     durante el turno, no antes de una regeneración del primero.
   - Antes del arreglo este caso no existía, porque el título solo se
     generaba al crear. El costo es chico: se cambia el título y se hace una
     llamada de título más.
   - Arreglo simple: generar el título solo si el actual sigue siendo el de
     respaldo del primer mensaje (`fallbackConversationTitle`), y usar ese
     valor como `replaceTitle`.
3. **No hubo turno real con OpenAI después del cambio de schema.** El IVA
   nuevo agrega `exclusiveMinimum` al JSON Schema, y `normalizeOpenAIJsonSchema`
   lo manda tal cual. El riesgo de rechazo es bajo: el schema resultante,
   `{"anyOf":[{"type":"number","exclusiveMinimum":0},{"type":"null"}]}`,
   combina dos formas que la API ya aceptó en la prueba real de la 39. Una
   es `solveForTargetPrice.amount`, que ya era `.positive()` y dio los
   "$ 550 por hora". La otra es cualquier número nullable con `minimum`,
   como `visits`. Igual conviene confirmarlo en el primer turno del smoke
   de la 41.
4. **Datos viejos con IVA 0 (teórico).** `getStoredOptionAmounts` y
   `formatBudgetForAI` siguen leyendo el IVA guardado, así que un presupuesto
   guardado con IVA 0 mostraría precios guardados al 0 % junto a un cálculo
   al 22 %, y solo el contexto `form` avisa. Una lectura de solo lectura
   muestra que hoy no hay ninguno: 331 opciones, 0 con IVA ≤ 0 y un único
   valor de IVA (22).

### Checkpoints (b6becae)

- C1: [x] `.\init.ps1` sale con 0.
- C2: [x] Una sola feature `in_progress` (la 35) y estados válidos.
- C3: [x] Sin cambios de capas: el guard nuevo de `data/agent/knowledge.ts`
  sigue el patrón de `data/`, y el resto de los arreglos queda en los
  archivos que ya tenían esa responsabilidad.
- C4: [x] Pasan harness, lint, `prisma validate`, `tsc`, los checks y el
  build de HEAD (registrado por la revisión de la 40).
- C5: [x] `b6becae` no agrega `console.log`, `debugger` ni TODO. Todos los
  archivos TS que toca tienen 200 líneas o menos (el mayor de la 39 es
  `lib/agent/budget-calculation.ts`, con 197). Los scripts de prueba y el
  shim de `server-only` quedaron en el scratchpad, fuera del repo.

### Evidencia (HEAD `b6becae`)

Corrí todo dos veces sobre el mismo árbol: antes y después del corte por
límite de uso. Entre una y otra, HEAD y el código no cambiaron.

- `.\init.ps1`: pass, las dos veces. Harness OK (1 `in_progress`, 41
  features), `prisma validate` OK, ESLint completo OK.
- `pnpm exec tsc --noEmit --incremental false`: pass, exit 0, las dos veces.
- `pnpm check:agent-tools`: pass, con `scripts/agent-input-checks.ts`.
- Regresiones `pnpm check:finance`, `check:finance-trend`,
  `check:official-budgets` y `check:mail-agent`: pass.
- `pnpm check:ai-gateway` y `pnpm check:agent-proposals` (adicionales,
  porque `b6becae` también toca la 38 y la 40): pass.
- Reproducción del bloqueante sobre el código arreglado: script puro, con un
  shim vacío de `server-only` en el scratchpad y sin base; resultados en
  "Resuelto", punto 1.
- Mutaciones: 11 sobre una copia de `b6becae` en el scratchpad, con el
  `node_modules` del repo enlazado y después desenlazado; resultados en
  "Menores nuevos", punto 1.
- Forma del JSON Schema del IVA nuevo, generada con `asSchema` del SDK:
  `{"anyOf":[{"type":"number","exclusiveMinimum":0},{"type":"null"}]}`.
- Consulta de solo lectura a la base: 331 opciones de presupuesto, 0 con
  IVA ≤ 0; 0 conversaciones del agente y 0 eventos de consumo sin precio.
- `next build`: no lo corrí, por indicación del líder. La revisión de la 40
  lo registra sobre HEAD `b6becae` (pass, exit 0), en
  `progress/review_agent_proposals.md`.
- Sin OpenAI, sin servidor de desarrollo y sin escrituras en la base.

### Criterios de aceptación (b6becae)

Los ocho siguen cumplidos. Cambia:

- **Criterio 4 (prompt y regla de precios):** la fuente ya no puede rotular
  como sin IVA un importe con IVA.
- **Criterio 5 (tools):** el JSON plano ahora está garantizado en tiempo de
  ejecución.
- **Criterio 6 (`draftEmail`):** las fuentes registradas son las citadas.
- **Criterio 7 (ruta):** conserva el 403 correcto por lectura, pendiente de
  ejecución en el smoke de la 41.
