# Review - agent_budget_sheet

**Verdict:** APPROVED

Rama `feature/41-agent-budget-sheet`. Revisé `d0e7d52..595870c`: `e4b89c8`
(feat) y `595870c` (docs), 81 archivos. El checkout es
`feature/44-agent-pricing-rules`, con HEAD `16ff4ae`. Las líneas citadas son
de HEAD `16ff4ae`, salvo que diga otra cosa. Los archivos centrales de la 41
no cambiaron después: el transport, `use-agent-chat`, las mutaciones, el
estado de la propuesta, el Markdown, las acciones de uso y de modos y los
helpers puros. En esos archivos, la línea es la misma en `595870c`.

Lo revisé contra `docs/architecture.md`, `docs/conventions.md`,
`docs/verification.md`, `CHECKPOINTS.md`, `AGENTS.md` y `docs/agent-plan.md`
(feature 41 y "Ajustes al implementar la 41"). También contra `docs/agent.md`
("Sheet", "Propuestas" y los checks), `progress/current.md`
(feature 41 y las líneas "Para la 41" de la 40) y
`progress/impl_agent_budget_sheet.md`. Por último, contra la entrada 41 de
`feature_list.json` y las correcciones de la 5 y la 7.

Todos los checks pedidos pasan. Pasan en HEAD y también en una copia de
`595870c` sola, en el scratchpad. No hay violaciones de arquitectura. Los
requisitos que la 40 le dejó a la 41 están cumplidos. Los hallazgos son
menores.

## Findings

### Bloqueante

Ninguno.

### Menores (no bloqueantes)

1. **La fila del historial muestra "US$ 0,00" para una conversación sin precio.**
   - **Qué pasa.** `toCostRow` devuelve `costUsd: 0` y `priced: false`
     cuando la suma es NULL (`data/agent/usage.ts:37,40`).
     `listAgentConversations` pasa solo `costUsd`
     (`actions/agent/conversations.ts:36`), y la fila hace
     `formatUsd(conversation.costUsd)`
     (`components/agent/agent-conversation-row.tsx:66`). Si una parte tiene
     precio y otra no, la fila muestra solo la parte con precio, sin marca.
   - **Cómo lo reproduje.** Con un script puro en el scratchpad y las
     funciones de la 41, para una conversación sin precio:
     - la fila del historial da `US$ 0,00`;
     - el badge da `US$ 0,00 + sin precio`;
     - la línea de uso da `precio no configurado`;
     - el grupo del diálogo de costos da `sin precio`.

     Es el escenario del smoke del implementador con
     `AI_MODEL_BAJO=gpt-4.1-mini`.
   - **Por qué importa.** Contradice la regla que la feature se pone
     (`lib/agent/usage-format.ts`: "Sin precio configurado se dice, en vez de
     inventar un número"; `docs/agent.md`: "nunca US$ 0,00"). En el
     historial, las otras conversaciones no tienen ningún aviso al lado.
   - **Por qué no bloquea.** Solo pasa con un modelo sin precio configurado:
     los tres modos por defecto tienen precio. Además, las superficies de
     costo (línea, badge y diálogo) sí lo marcan, y no toca datos del
     negocio.
   - **Arreglo mínimo.** Pasar `priced` en la lista (o `unpricedEvents` por
     conversación) y formatear la fila con `formatUsageCost`, o agregar
     "+ sin precio" como hace el badge.

2. **`check:agent-sheet` no falla si se rompen varias de las invariantes que dice cubrir.**
   - **Qué pasa.** El check de fuente busca textos que siguen presentes
     aunque se rompa lo que dice cubrir. Lo probé con mutaciones en una
     copia de `595870c`, en el scratchpad. Cada fila dice qué rompí y qué
     pasaría:

     | Mutación | Qué pasaría | Resultado |
     | --- | --- | --- |
     | **M1.** `useChat<AgentUIMessage>({ id: chat.id, … })` en vez de `{ chat, … }` (`components/agent/hooks/use-agent-chat.ts:27`) | El Chat deja de ser la instancia del host: cerrar el Sheet pierde la conversación | Pasan el check y `tsc` |
     | **M2.** `canAct` sin `Boolean(live)` (`components/agent/cards/agent-proposal-card.tsx:55`) | Se ofrece confirmar sin el estado vivo | Pasa |
     | **M4.** `getDisplayStatus` devuelve siempre el estado guardado (`components/agent/cards/agent-proposal-status.tsx:16`) | La tarjeta vuelve a leer la salida de la tool, que dice PENDING para siempre | Pasa |
     | **M3.** Redirigir sin `result.budgetId === budgetId` (`components/agent/agent-sheet-host.tsx:54`) | Duplicar desde el detalle llevaría a la copia | Pasa |
     | **M9.** Confirmar sin `onSettled: refreshProposals` (`components/agent/hooks/use-agent-proposal-mutations.ts:43`) | La tarjeta no relee el estado después de confirmar | Pasa |
     | **M8.** Seguir consultando cada 3 s una EXECUTING con resultado desconocido | Polling que no termina | Pasa |

     Los controles sí fallan: el formulario sin sanear (M5), sacar la
     invalidación del detalle (M6) y el umbral `>` en vez de `>=` (M7).
   - **Por qué importa.** Los comentarios del check
     (`scripts/agent-sheet-source-checks.ts:70-78,92-102`) dicen que cubren
     que la instancia vive en el host y que la tarjeta lee el estado vivo. Son
     justo los requisitos que pidieron esta revisión y la de la 40. El
     implementador informó "17 de 17" mutaciones, pero sobre lo que el check
     asserta. El código de hoy está bien: lo verifiqué leyendo (ver abajo).
   - **Arreglo sugerido.**
     - Assertar `useChat<AgentUIMessage>({ chat,` en `use-agent-chat.ts`.
     - Llevar a un módulo puro de `lib/agent/` `getDisplayStatus`, la regla
       de `canAct`, `hasRunningProposal` y la condición de redirigir, y
       probarlos con entradas.
     - Assertar `onSettled: refreshProposals` dentro de la mutación de
       confirmar.

3. **Detalle: un enlace `//dominio` en una respuesta se trata como interno.**
   - **Qué pasa.** `components/agent/agent-markdown.tsx:45` decide con
     `href?.startsWith("/")`. `defaultUrlTransform` de react-markdown deja
     pasar `//example.com/b`, porque no tiene protocolo.
   - **Cómo lo reproduje.** Rendereé `AgentMarkdown` con
     `renderToStaticMarkup`, en la copia de `595870c`:
     - `https://example.com/a` sale con `target="_blank" rel="noreferrer"`;
     - `//example.com/b` sale como `next/link`, sin `target` ni `rel`.
   - **Por qué importa.** Poco. Un click navega la pestaña al dominio externo,
     y salir de la página corta el stream en curso
     (`use-agent-session.ts:46`). Solo pasa si el modelo escribe un enlace
     así, por ejemplo copiado de un texto guardado.
   - **Arreglo.** `href?.startsWith("/") && !href.startsWith("//")`.

### Verificado sin hallazgos

- **El host es dueño de la sesión.**
  - `useAgentSession` guarda la instancia `Chat` en `useState`, dentro del
    host.
  - `useChat` la recibe con `{ chat }` (`use-agent-chat.ts:27`). En
    `@ai-sdk/react@4.0.108`, una instancia externa no se detiene al
    desmontar: `node_modules/@ai-sdk/react/dist/index.js:350-364`, con
    `isExternallyManaged`.
  - `SheetContent` (Radix) desmonta el contenido al cerrar. Lo único que
    sobrevive está en el host, que es donde vive la sesión.
  - El `onFinish` va en el constructor del `Chat` (`agent-transport.ts:38-48`).
    El hook lo ignora en una instancia externa, así que con el Sheet cerrado
    igual refresca títulos, costos y propuestas.
  - Cambiar de conversación o desmontar el host corta el stream anterior
    (`use-agent-session.ts:46`), como documenta la feature.
  - Las lecturas viejas se descartan con `requestRef`.
- **Modo, habilidad y contexto viajan con cada envío.**
  - `send` y `retry` pasan `{ body: requestOptions(skill) }`, y
    `requestOptions` llama `getContext()` en ese momento
    (`use-agent-chat.ts:30-53`).
  - En `ai@7.0.105`, `HttpChatTransport` arma
    `{ ...this.body, ...options.body }` por pedido.
  - `buildAgentChatBody` manda solo el último mensaje del usuario con sus
    partes de texto. El historial lo lee el servidor.
  - La sugerencia del estado vacío usa el mismo `send`. No hay
    `sendAutomaticallyWhen` ni `resume`.
- **Contexto del formulario.**
  - Se lee al enviar: `getFormValues={() => form.getValues()}`
    (`components/budgets/create-budget/Header.tsx:34`) y
    `sanitizeFormContextValues` (`agent-sheet-host.tsx:47`). No hay `watch()`.
  - Los campos que no pasan su schema no viajan, y el cuerpo resultante pasa
    el schema de la ruta (lo cubre el check).
  - Matiz, sin hallazgo: un número vacío en un campo `min(0)` viaja como 0
    por `z.coerce`. Es lo mismo que hacen el schema y la vista previa del
    formulario.
- **El guard va primero.** `requireAdminSession()` es lo primero que corre en
  cada acción nueva:
  - `getAgentConversationCost` y `getAgentMonthlyCost`
    (`actions/agent/usage.ts:18,32`);
  - `getAgentSettings` (`actions/agent/settings.ts:16`).

  Además, los lectores de `data/agent/usage.ts` vuelven a llamar al guard.
  `getConversationCost` filtra por `userId`, y el top del mes muestra el
  título solo de las conversaciones propias. La ruta sigue con el guard
  primero.
- **No queda código ni ruta del chat viejo.**
  - Los seis archivos se borraron.
  - No hay imports ni `db.chat` / `db.message` en `app`, `components`,
    `actions`, `data` ni `lib`.
  - `lib/format-budget.ts` sigue en uso (`lib/agent/context.ts`), igual que
    `lib/ai-chat-copy.ts`. `openai` lo sigue usando el agente de correo.
  - El build del líder lista 38 rutas, sin `/api/ai-chat/stream`.
  - Se borró `handleGenerateAI`, que de hecho nunca corría: `AIButton`
    esparce `props` después de `onClick`, y el `onClick` del
    `SheetTrigger` le ganaba.
- **Requisitos que dejó la 40.**
  - **EXECUTING vieja.** Pasados 6 minutos, el DTO trae `unknownOutcome`
    (`lib/agent/proposals.ts:143`). La tarjeta la muestra como "Resultado
    desconocido" y deja de consultar (`use-agent-queries.ts:22,32`). El
    prompt también la marca (`lib/agent/proposal-context.ts:42-44`).
    Verifiqué en la base, solo lectura, que `updateMany` mueve `@updatedAt`:
    en las 3 CONFIRMED, `updatedAt` y `resolvedAt` difieren en 1 a 2 ms.
  - **Trabajos vinculados.** La nota dice que los avisos se calcularon al
    proponer y que los trabajos pueden haber cambiado
    (`agent-proposal-card.tsx:78`).
  - **Confirmar sin `proposal`.** `readConfirmResponse` acepta las cuatro
    formas (`lib/agent/proposal-outcome.ts:33-38`).
  - **Estado vivo.** La tarjeta usa `listAgentProposals` y no ofrece
    confirmar sin él (`agent-proposal-card.tsx:55`).
  - **Invalidaciones.** Confirmar invalida `["budgets"]`, `["budget"]` y
    `officialBudgetKeys.all`, y siempre relee las propuestas
    (`use-agent-proposal-mutations.ts:37-43`). Son las mismas claves que usan
    `useBudgets` y `useBudget`. Los callbacks están en `useMutation`, así que
    corren aunque se cierre el Sheet.
  - **Redirigir.** Pasa solo si es el presupuesto abierto y cambió el slug
    (`agent-sheet-host.tsx:54`). Duplicar o crear no redirigen.
  - **Enlaces del resultado.** `ResultLinks` usa `result`, con la versión
    oficial N+1, y no el slug predicho.
- **Errores.**
  - En `ai@7.0.105`, un HTTP no-ok es `APICallError` con `statusCode`
    (`createUIApiCallError`). El `{ error }` de la ruta se muestra tal cual,
    un 504 da el mensaje de demora y un `TypeError` el de conexión.
  - La sesión vencida redirige en `proxy.ts` y el transport lo detecta
    (`agent-transport.ts:16`).
  - Reintentar reenvía el mismo id y el servidor no duplica el mensaje.
- **Servidor (39 y 40).**
  - `stopped` se evalúa al entrar a `onEnd`, en el flush o el cancel del
    stream: antes de que cierre la respuesta.
  - `priced` por grupo refleja las sumas NULL de Postgres.
  - `updatedAt` en el DTO no rompe a los que construyen `ProposalRow`: `tsc`
    pasa.
- **`feature_list.json`.** La 7 queda `done` con "Superseded by feature
  41". La 5 se acota a Resend y Cloudinary: el cliente OpenAI del correo ya
  lee la clave dentro de la función. La 41 sigue `pending`, con la 35 como
  única `in_progress`.
- **Tamaño y limpieza.** Los archivos de código tienen 200 líneas o menos. El
  más largo es `lib/agent/proposals.ts`, con 197. No se agregan
  `console.log`, `debugger` ni TODO, salvo el mensaje de éxito del check, que
  es el patrón de todos los checks.
- **Cambios posteriores de 42, 43 y 44 sobre archivos de la 41.** Ninguno
  rompe la 41:
  - La 42 pasa `budgetId` a un `scope` y lleva la lista a
    `AgentConversationList`. También cuenta como `persisted` la conversación
    leída al abrir, aunque no esté entre las 50 de la lista: eso arregla un
    borde de la 41.
  - La 43 hace que la tarjeta use el resumen vivo y suma el editor. Ahora el
    DTO expone los `values` de las propuestas de crear. Es una decisión de la
    43, con propuestas propias.
  - La 44 redondea la hora.
  - El check de fuente se actualizó en la 42 y sigue verde.

### Fuera de alcance (para otra feature)

- **`uploadBase64Image` quedó sin uso.** En `lib/cloudinary.ts` solo queda un
  import comentado, en `actions/settings.ts:5`. Lo decide la feature 5.
- **Las tablas `Chat` y `Message` siguen con el historial del chat viejo.**
  Ya no se ven desde la UI. El plan deja el borrado para una migración
  posterior. Conviene decidir antes si ese historial se exporta.
- **`AIButton.onGenerate` ya no lo usa nadie.**

## Checkpoints

- **C1: [x]** Existen los archivos del harness y `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35). La 41 sigue `pending`, con
  el mismo criterio que 38-40, y `progress/current.md` la describe como
  implementada y sin revisar.
- **C3: [x]**
  - Las escrituras (conversaciones y propuestas) pasan por `actions/agent/*`.
  - Las lecturas nuevas son acciones con el guard primero, que delegan en
    `data/agent/*`.
  - Los schemas están en `schemas/agent.ts`, y los helpers puros en
    `lib/agent/*`, sin `server-only`.
  - Los wrappers que lanzan `ValidationError` están en
    `components/agent/actions/`, y los hooks en `components/agent/hooks/`.
  - El cliente no importa código `server-only` (lo cubre el check), y el
    build del líder pasa.
  - No hay providers globales nuevos: `TooltipProvider` va dentro del Sheet.
- **C4: [x]** Pasan el harness, lint, `prisma validate` y `tsc`. El build lo
  corrió el líder y el smoke autenticado, el implementador.
- **C5: [x]**
  - No hay archivos temporales en el rango y el árbol estaba limpio.
  - Se sacó el `console.log` del mock de crear, y no se agregan logs de
    depuración.

## Evidence

- `.\init.ps1` (PowerShell, HEAD `16ff4ae`): **pass**, exit 0. Harness con 44
  features y una `in_progress`, `prisma validate` y ESLint.
- `pnpm exec tsc --noEmit --incremental false` (HEAD): **pass**, exit 0 en
  14 s.
- Checks en HEAD, todos **pass**:
  - `pnpm check:agent-sheet` ("Agent sheet checks passed");
  - `pnpm check:agent-tools`;
  - `pnpm check:agent-proposals`;
  - `pnpm check:ai-gateway`;
  - `pnpm check:official-budgets`;
  - `pnpm check:mail-agent`.
- Regresiones extra en HEAD, todas **pass**:
  - `check:official-budget-workspace`;
  - `check:mail-official-budgets`;
  - `check:finance`.
- **Copia de `595870c` sola.** La armé con `git archive` en el scratchpad y
  un junction a `node_modules`, sin tocar git. Todo **pass**:
  - `tsc` (14 s);
  - ESLint (19 s);
  - `scripts/harness-validate.mjs`: 41 features, la 35 `in_progress`, la 41
    `pending`, la 7 `done` y la 5 `pending`;
  - los seis checks pedidos.
- **Mutaciones** en la copia (hallazgo 2): 9 en total. El check detecta 3
  (M5, M6 y M7) y no detecta 6 (M1, M2, M3, M4, M8 y M9). M1 tampoco la
  detecta `tsc`.
- **Scripts puros** en el scratchpad:
  - la fila del historial contra el badge, la línea y el diálogo sin precio
    (hallazgo 1);
  - el render de enlaces de `AgentMarkdown` (hallazgo 3).
- **Lectura de control**, solo lectura, contra la base del `.env`:
  `AgentProposal` tiene CONFIRMED=3 y PENDING=11. En las confirmadas,
  `updatedAt − resolvedAt` da 1 a 2 ms, así que `updateMany` mueve
  `@updatedAt`. No imprimí datos del `.env`.
- **`pnpm exec next build` del líder** sobre HEAD `16ff4ae`, que cubre 41-44:
  **pass**. Salió con exit 0 en 39 s. Compiló en 11,1 s, pasó TypeScript,
  generó 29 páginas estáticas y listó 38 rutas: `ƒ /api/agent/chat` y
  `ƒ /dashboard/agent` están, y `/api/ai-chat/stream` no. El log
  (`scratchpad\next-build-16ff4ae.log`) coincide. Yo no corrí build, porque
  `.next/` es compartido.
- `prisma migrate status`: no hizo falta, porque la 41 no toca `prisma/`.

## Criterios de aceptación

1. **El detalle y crear abren el agente en el Sheet, con contexto guardado o
   sin guardar: cumplido.** Ver `BudgetView.tsx:76` y `Header.tsx:34`. En el
   detalle retoma la última conversación del presupuesto, y en crear arranca
   una nueva.
2. **Selector de modo, chips, historial con renombrar y borrar y badge de
   costo: cumplido.** Salvedad: la fila del historial muestra US$ 0,00 sin
   precio (hallazgo 1).
3. **Texto, chips de tools y tarjetas desde las partes, y línea de uso con
   modelo, modo, tokens y costo: cumplido.**
   - Hay una tarjeta por cada `card` que puede devolver una tool, y lo
     verifica el check.
   - La línea dice "precio no configurado" cuando falta el precio, y
     "Respuesta detenida" también después de recargar.
4. **La tarjeta de correo copia como email o WhatsApp con el formateador
   existente: cumplido.** Usa `getChatCopyPayload` de `lib/ai-chat-copy.ts`,
   y el email va con texto y HTML.
5. **Enter envía, Shift+Enter hace un salto y Stop corta: cumplido.** Ignora
   `isComposing`, y el Stop aparece mientras está `submitted` o `streaming`.
6. **Confirmar y rechazar por las acciones, invalidando presupuestos y
   oficiales: cumplido.** Además relee las propuestas y redirige si cambió
   la dirección.
7. **El diálogo de costos informa esta conversación, el mes por modelo y
   modo, y el uso sin precio: cumplido.** Un grupo sin precio dice "sin
   precio" y hay un aviso con el conteo. El mes lo decide el servidor, y se
   navega hacia atrás.
8. **Se borran el chat viejo, la ruta, `save-chat`, `upload-chat-image` y
   `ai-system-message`, y la 7 queda reemplazada: cumplido.**
9. **Estados de carga, vacío, error, escritorio y 390x844 en el smoke
   autenticado, con lint y build: cumplido, con recomendaciones.** Ver
   abajo.

## Evidencia de la prueba autenticada del implementador

- **Alcanza para:**
  - crear con el formulario sin guardar (cambios vistos en el turno
    siguiente, y el creado con los precios de la tarjeta);
  - el detalle, con la propuesta confirmada y otra rechazada;
  - el modo Alto con Sol y los costos;
  - correo y copiar;
  - Consejos, con los números de Finanzas;
  - cerrar y reabrir, recargar y Stop;
  - el historial, incluido el estado vacío;
  - el error sin clave y con un modelo inexistente;
  - el modelo sin precio;
  - 390x844, claro y oscuro, y la consola limpia.

  Gastó US$ 0,24 y los datos de prueba se borraron.
- **Falta, recomendado y sin bloquear:**
  - **Cerrar el Sheet en pleno stream y reabrirlo.** Es la promesa central
    del diseño. El smoke registra por separado "cerrar y reabrir" y "Stop en
    pleno stream". Lo verifiqué leyendo el SDK (arriba).
  - **La redirección por cambio de dirección.** Quedó NOT RUN; se puede
    probar con una propuesta que cambie el nombre.
  - **El 403 de un usuario logueado que no es admin.** Está pendiente desde
    la 40, porque no hay un usuario así.
  - **Registrar el estado de carga.** El criterio 9 lo nombra, pero el
    reporte no lo menciona.
  - **Una EXECUTING real de más de 6 minutos.** La cubre el check con el
    umbral en los dos lados.
