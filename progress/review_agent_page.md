# Review - agent_page

**Verdict:** APPROVED

Rama `feature/42-agent-page`. Revisé `595870c..01e6226` (`35e5c22` feat y
`01e6226` docs) sobre el checkout de `feature/44-agent-pricing-rules`, HEAD
`16ff4ae`. Lo contrasté con `docs/architecture.md`, `docs/conventions.md`,
`docs/verification.md`, `CHECKPOINTS.md`, `AGENTS.md`, `docs/agent-plan.md`
(feature 42 y "Ajustes al implementar la 42"), `docs/agent.md` ("Sheet" y
"Página"), `progress/current.md` (sección 42), `progress/impl_agent_page.md`
y la entrada 42 de `feature_list.json`.

Todos los checks pedidos pasan, en HEAD y en una copia exacta de `01e6226`.
No hay violaciones de arquitectura ni de pertenencia, y los criterios se
cumplen en los caminos principales. Los hallazgos son menores: estados de
borde de la sincronización entre la dirección y la sesión, un borrado que
puede perder su `onDeleted` y huecos en los checks. El 1 y el 2 tienen
arreglos chicos, y el del 1 ya está probado en el arnés.

Entre las features siguientes, la 43 es la única que cambió código de este
rango: `components/agent/agent-chat.tsx`, al que sumó el editor de
presupuestos y la condición de `hasProposalParts`. Ese cambio no rompe ni
arregla nada de la 42. El hook de la dirección, la sesión, la lista, los
hosts y los checks de la 42 son idénticos en HEAD, así que los hallazgos
valen igual ahí.

## Findings

### Bloqueante

Ninguno.

### Menores (no bloqueantes)

1. **La dirección y la pantalla se desincronizan en los estados de error y de carga.**
   - **Qué pasa.**
     - **Error.** Cuando la dirección queda sin id, `followUrl` arranca una
       nueva solo si `session.conversationId === null || session.persisted`
       (`components/agent/hooks/use-agent-page-url.ts:19-25`, la condición
       en `:22`). En la pantalla "Conversación no encontrada" de un id que
       no existe, `conversationId` es ese id y `persisted` es falso: no hay
       fila ni `saved`. Entonces el link del sidebar cambia la dirección a
       `/dashboard/agent`, pero la pantalla sigue en el error. Recargar
       arranca una nueva, así que pantalla y dirección no coinciden.
     - **Carga.** Pasa lo mismo mientras carga una conversación abierta por
       link que todavía no está en la lista: una más vieja que las 100, o
       una abierta antes de que llegue la lista. El clic en el sidebar se
       ignora y, al terminar de cargar, el `replaceState` (`:30-35`) vuelve
       a escribir `?conversacion=<id>`. Encima, la entrada que dejó el Link
       termina con el mismo id.
     - **Fila que falla.** Si falla abrir una fila (lista vieja, por ejemplo
       porque se borró en otra pestaña), la pantalla muestra el error de B
       pero la dirección sigue en A, porque el comentario de `:28-29` decide
       dejarla como está. Recargar abre A. En ese error, `persisted` es
       verdadero por la fila vieja (`components/agent/hooks/use-agent-session.ts:109-111`).
   - **Cómo lo reproduje.** Con el arnés
     `scratchpad/review-42/tree42/review-harness/url-sync.tsx`. Monta el
     hook real de la 42 con `react-dom/client` (sin DOM) y un
     `next/navigation` simulado con la misma semántica que el
     `replaceState` que parchea Next 16: actualiza `useSearchParams` y
     conserva `__NA` (`node_modules/next/dist/client/components/app-router.js:256-266`).
     La sesión es una réplica de la parte de `useAgentSession` que usa la
     dirección. Resultados:
     - S4 (error y link del sidebar): queda `status: "error"` con la dirección
       `/dashboard/agent`.
     - S10 (carga fuera de la lista y sidebar): queda la conversación vieja
       con `?conversacion=convOLD01`.
     - S11 (fila que falla): el error es de B con `?conversacion=convA0001`.
   - **Por qué importa.** El criterio 4 dice que el link del sidebar arranca
     una nueva, y `docs/agent.md` ("Página") dice que un cambio que llega de
     afuera abre esa conversación o arranca una nueva. En el camino
     principal se cumple (S6 y el smoke), y la pantalla de error tiene su
     botón "Nueva conversación". Por eso no lo marco bloqueante.
   - **Arreglo mínimo, probado en el arnés.** Con el primer cambio pasan S1
     a S10; con los dos, S1 a S11.
     - En `use-agent-page-url.ts:22`:
       `} else if (session.state.status !== "ready" || session.persisted) {`.
       Así solo se respeta una conversación nueva, lista y sin guardar, que
       es la que puede estar en su primer turno.
     - Para S11: que `target` refleje también el error
       (`: session.state.status === "error" ? session.conversationId : undefined`
       en `:30-31`), o invalidar el historial cuando abrir da "no
       encontrada".

2. **Cerrar el historial mientras se borra pierde el `onDeleted`, una regresión frente a la 41.**
   - **Qué pasa.**
     - **La causa.** `AgentDeleteDialog` llama a `onDeleted` en el callback
       de `mutate` (`components/agent/agent-conversation-dialogs.tsx:121-126`).
       TanStack Query v5 ejecuta ese callback solo si el componente sigue
       montado (`@tanstack/query-core/build/modern/mutationObserver.js:77`,
       `this.#mutateOptions && this.hasListeners()`).
     - **Qué cambió.** En la 41, los diálogos de renombrar y borrar eran
       hermanos del `Dialog` del historial y seguían montados mientras el
       Sheet estuviera abierto. En la 42 viven dentro de
       `AgentConversationList` (`components/agent/agent-conversation-list.tsx:107-108`).
       En el Sheet y en la página angosta, esa lista va dentro del
       `DialogContent` del historial
       (`components/agent/agent-history-dialog.tsx:42-58`), y Radix lo
       desmonta al cerrar (`Presence present={forceMount || context.open}`).
     - **La secuencia.** "Cancelar" sigue habilitado durante "Borrando…"
       (`agent-conversation-dialogs.tsx:112`) y no cancela la acción. Si
       después se cierra el historial antes de que responda el servidor, el
       toast "Conversación borrada" y la relectura salen igual, porque son
       del hook. Pero `onConversationDeleted` no corre y la conversación
       borrada sigue abierta. Si se había abierto desde el historial, además
       sigue figurando guardada: `persisted` incluye `saved`
       (`use-agent-session.ts:110-111`).
     - **La consecuencia.** El turno siguiente la recrea con el mismo id,
       porque `claimAgentConversation` la crea si no existe
       (`lib/agent/conversation-store.ts:43-54`). Queda con el mensaje nuevo
       nada más, mientras la pantalla sigue mostrando los viejos.
   - **Cómo lo reproduje.** Con `review-harness/delete-unmount.tsx`, que usa
     TanStack Query real. Con la forma de la 41 corren el `onSuccess` del
     hook y `onDeleted`. Con la de la 42 (el diálogo dentro de un historial
     que se cierra antes de la respuesta) corre solo el del hook.
   - **Por qué importa.** Rompe "Borrar la activa arranca una nueva"
     (`docs/agent.md`, "Sheet") con una secuencia rápida pero posible. En la
     columna de la página no pasa, porque siempre está montada.
   - **Arreglo mínimo.** Usar
     `remove.mutateAsync(id).then(() => { onDeleted(id); onClose(); }, () => {})`,
     porque la promesa se resuelve aunque el componente se desmonte. La otra
     opción es volver a dejar los diálogos de fila fuera del `DialogContent`
     del historial.

3. **"Abrir en página" justo al terminar el primer turno abre una conversación nueva.**
   - **Qué pasa.** El href es `getAgentPageUrl(persisted ? conversationId : null)`
     (`components/agent/agent-open-page-button.tsx:51`). En una conversación
     nueva, `persisted` pasa a verdadero recién cuando la relectura del
     historial de `refreshAfterTurn` trae la fila
     (`components/agent/queries.ts:63-73`, en `onFinish`). Entre el fin del
     stream, que habilita el botón, y esa relectura, el link va a
     `/dashboard/agent` sin id, aunque el servidor ya la guardó al empezar
     el turno. Resultado: la página arranca una nueva vacía.
   - **Cómo lo reproduje.** Escenario S12 del arnés. Con la conversación ya
     en la base y la lista sin releer, el href es `/dashboard/agent`. Después
     de releer, `/dashboard/agent?conversacion=new000001`.
   - **Por qué importa.** La ventana dura una ida al servidor, justo cuando
     el usuario terminó de leer la respuesta. No se pierde nada, porque la
     conversación está en la lista de la página.
   - **Arreglo.** Deshabilitar el botón mientras la conversación tenga
     mensajes y todavía no figure guardada, o invalidar el historial cuando
     empieza el stream.

4. **Los checks no fallarían con nueve roturas de lo que dicen cubrir.**
   - **Qué pasa.** `check:agent-page` es casi todo regex sobre el código
     fuente, más funciones puras. En una copia de `01e6226` apliqué nueve
     roturas y ninguna la detecta ningún check: los cuatro quedan en verde.
     - M1: sacar el `else` de `followUrl`. El link del sidebar ya no arranca
       una nueva.
     - M2: `useEffect(() => followUrl(urlId), [])`. La dirección que llega de
       afuera (sidebar, atrás y adelante) ya no se sigue. El check dice
       cubrir "the URL in both directions"
       (`scripts/agent-page-source-checks.ts:26-27`), pero solo afirma la
       línea de `openConversation` y que exista `useEffectEvent` (`:36-43`).
     - M3: buscar sin el nombre del presupuesto
       (`agent-conversation-list.tsx:57`).
     - M4: la columna sin `onDeleted` (`agent-page-host.tsx:74`).
     - M5: las filas del diálogo de la página sin presupuesto
       (`agent-history-dialog.tsx:53`).
     - M6: la cabecera sin link al presupuesto (`agent-page-header.tsx:44`).
     - M7: `getAgentConversations` sin `userId: session.user.id`
       (`data/agent/conversations.ts:58`). Con `all`, es el único filtro que
       queda.
     - M8: `ensureStarted` con `scope.kind === "all"`
       (`use-agent-session.ts:95`). El Sheet de crear retomaría la última
       conversación sin presupuesto.
     - M9: `onConversationDeleted` sin `startNew` (`use-agent-session.ts:122`).
     - Los tres controles positivos sí se detectan: el tope de 1000,
       `pushState` y "Abrir en página" durante el stream. Así sé que el
       script de mutaciones funciona.
   - **Por qué importa.** Lo más delicado de la feature (dirección y sesión)
     y la pertenencia del historial completo no tienen una aserción que
     falle si se rompen. M8 y M9 son justamente que "el Sheet siga igual con
     el scope". Las 16 mutaciones que registró el implementador son otras.
   - **Arreglo.**
     - Un check de comportamiento del hook de la dirección. El arnés muestra
       que se puede montar con `react-dom/client` sin DOM en unas 100
       líneas.
     - Aserciones de fuente para M3 a M9.

5. **El tope de 100 no se avisa y la búsqueda no llega a las más viejas.**
   - **Qué pasa.** `take: all ? 100 : 50` (`data/agent/conversations.ts:63`),
     y la búsqueda filtra en el cliente sobre lo cargado
     (`agent-conversation-list.tsx:55-58`). Con más de 100 conversaciones,
     las más viejas no aparecen ni se encuentran buscando, y nada dice que
     la lista está recortada.
   - **Contexto.**
     - El tope está decidido y documentado (plan y `docs/agent.md`), y hoy
       hay pocas conversaciones.
     - Una conversación vieja abierta por link sí funciona, gracias a
       `saved`.
   - **Sugerencia.** Mostrar "Se muestran las 100 más recientes" cuando
     llegan 100, o buscar en el servidor.

6. **En el Sheet de crear, "Abrir en página" sale del formulario sin guardar.**
   - **Qué pasa.** El botón es un `Link` (`agent-open-page-button.tsx:24-30`),
     también en el Sheet de crear (`components/budgets/create-budget/Header.tsx:34`).
     Navega fuera del formulario, que no guarda borradores ni avisa: no hay
     guard de cambios sin guardar en la app. En la página, la conversación
     sigue sin el formulario, como está documentado.
   - **Contexto.** El smoke lo probó con el formulario vacío.
   - **Sugerencia.** Ocultarlo en crear, abrir la página en otra pestaña
     desde ahí o avisar si el formulario tiene cambios.

7. **A confirmar: un `replaceState` durante una navegación pendiente la descarta.**
   - **Qué pasa.** El `replaceState` parcheado por Next despacha
     `ACTION_RESTORE` (`app-router.js:256-266`). Esa acción marca como
     descartada la acción pendiente de la cola (`app-router-instance.js:139-146`),
     incluida una navegación que espera al servidor
     (`navigate-reducer.js:123-125`, `NavigationResultTag.Async`). Casi
     ninguna pantalla del dashboard tiene `loading.tsx`. Si la página
     escribe la dirección justo después de un clic a otra pantalla, esa
     navegación se pierde. Por ejemplo, cuando la relectura marca guardado
     el primer turno.
   - **Estado.** No lo reproduje en el navegador. Si se confirma, se puede
     aceptar como límite (es el patrón que documenta Next) o no escribir la
     dirección mientras haya una navegación en curso.

### Verificado sin hallazgos

- **Guard y pertenencia.**
  - La ruta está bajo `app/(private)/layout.tsx`, que redirige a quien no
    es ADMIN. Además, `proxy.ts` manda al login a quien no tiene sesión.
  - `listAgentConversations` llama a `requireAdminSession()` antes de
    validar con `agentConversationListSchema` (`actions/agent/conversations.ts:26-31`).
  - `getAgentConversations` vuelve a exigir admin y filtra por `userId`
    también con `all` (`data/agent/conversations.ts:55-65`).
  - `getAgentConversationAction` exige admin, valida el id y busca con
    `{ id, userId }` (`:45-56`, data `:70-76`).
  - `agent-reads.action.ts` corre en el cliente y solo traduce el `scope` a
    la entrada. Un `all` falsificado solo trae lo propio.
  - Un id ajeno da "Conversación no encontrada", sin datos. Mientras dura
    el error no hay `Chat`, así que no se puede mandar un turno, y la ruta
    igual rechaza ids ajenos (39).
- **Contexto.**
  - `getContext={() => pageBudgetContext(budget)}` usa
    `session.conversation?.budget` (`agent-page-host.tsx:34,87`), y
    `useAgentChat` lo lee al enviar.
  - Una conversación de un presupuesto manda `{ kind: "saved", budgetId }`.
    Una nueva o de crear va sin contexto (`budget` null).
  - El check parsea las dos cosas con `agentChatRequestSchema`, y el smoke
    leyó el cuerpo del pedido.
- **Dirección y sesión, en el arnés con el hook real.** Pasan:
  - S1: entrar sin id.
  - S2: entrar con un id que existe.
  - S3: id inexistente, error y "Nueva conversación", que limpia la
    dirección.
  - S5: id inválido, que se ignora y se limpia.
  - S6: sidebar, atrás (reabre A) y adelante (nueva).
  - S7: el primer turno escribe `?conversacion=` sin reabrir la
    conversación.
  - S8: borrar la abierta arranca una nueva y limpia la dirección.
  - S9: con dos clics seguidos mientras carga, gana el último (`requestRef`).
- **Sin remontar.**
  - Next guarda el estado de la página con la clave del segmento sin los
    parámetros (`layout-router.js:374`, `createRouterCacheKey(segment, true)`),
    así que cambiar `?conversacion=` no remonta el host.
  - `AgentChat` va con `key={state.id}`.
- **Cambiar de conversación mientras responde.** El efecto
  `() => void chat?.stop()` (`use-agent-session.ts:46`) corta el stream
  anterior, y la dirección cambia recién cuando la nueva está lista.
- **"Abrir en página".**
  - Se deshabilita con `submitted` o `streaming`.
  - `useChat({ chat })` con un `Chat` externo no lo detiene al desmontar
    (`@ai-sdk/react` 4.0.108, `isExternallyManaged`), así que el botón no
    afecta al stream del Sheet.
- **Búsqueda.** Con el matcher real, `review-harness/search.ts` pasa sus 9
  casos:
  - "guarani" y "GUARANÍ" encuentran "Guaraní", y "nandu" encuentra
    "Ñandú".
  - Mayúsculas, espacios y vacío funcionan.
  - En el Sheet se busca solo por título.
- **El Sheet con `scope`.**
  - Las claves de query no cambian: el id del presupuesto o
    `"sin-presupuesto"`.
  - `ensureStarted` hace lo mismo: retoma en un presupuesto y arranca una
    nueva en crear.
  - Historial y descripciones iguales.
  - `persisted` ahora es verdadero apenas se abre (por `saved`): el costo y
    el modo se guardan sin esperar la lista.
  - `check:agent-sheet` pasa en `01e6226` y en HEAD.
- **Arquitectura.**
  - El zod del filtro pasó a `schemas/agent.ts`.
  - `lib/agent/{client-id,page-url,conversation-scope}.ts` son puros.
  - El sidebar importa solo `page-url` y `client-id`, sin zod.
  - No hay rutas de API nuevas ni cambios en la base.
  - Todos los archivos tocados tienen 200 líneas o menos. Los más largos
    son `dashboard-sidebar.tsx` (156) y `use-agent-session.ts` (145).
- **Limpieza.** No hay `console.log`, `debugger` ni TODO nuevos, salvo el
  mensaje de éxito del check.

### Fuera de alcance

- El dashboard scrollea 80 px de más por el layout global. Está documentado
  y la página lo amortigua con `overscroll-contain`.
- No hay guard de cambios sin guardar en el formulario de crear. Afecta
  también al sidebar, no solo al botón nuevo.
- Si otra pestaña borra la conversación abierta, `persisted` sigue
  verdadero por `saved` y el turno siguiente la recrea. Con la 41 también
  se recreaba.
- Datos de prueba: el implementador dejó dos conversaciones para borrar
  desde la página y anotó otra que no salió de su smoke. No lo comprobé,
  porque no consulté la base.

## Checkpoints

- **C1: [x]** Existen los archivos del harness y `.\init.ps1` sale con 0.
- **C2: [x]** Hay una sola `in_progress` (la 35). La 42 sigue `pending` a
  propósito, y `progress/current.md` la describe con su estado real.
- **C3: [x]** Los límites se respetan:
  - lecturas en `data/agent/`;
  - acciones con guard en `actions/agent/`;
  - zod en `schemas/`;
  - helpers puros en `lib/agent/`;
  - wrappers en `components/agent/actions/`.

  No se agregan rutas de API ni hay escrituras nuevas. La UI usa los
  primitivos de shadcn y `opsSurface`. Todos los archivos tienen 200 líneas
  o menos.
- **C4: [x]** Pasan el harness, ESLint, `prisma validate`, `tsc`, los cuatro
  checks y el `next build` del líder. El smoke autenticado del implementador
  cubre escritorio y 390x844. Los huecos de los checks están en el
  hallazgo 4.
- **C5: [x]** No quedan archivos temporales en el repo y el árbol estaba
  limpio. No hay debug ni TODO. Los datos de prueba están documentados.

## Evidence

- `.\init.ps1` (PowerShell): **pass**, exit 0 en 23,5 s. Harness con 44
  features y una `in_progress`, `prisma validate` OK y ESLint OK.
- `pnpm exec tsc --noEmit --incremental false` en HEAD: **pass**, exit 0 en
  14 s.
- Copia de `01e6226` (`git archive` al scratchpad, con `node_modules`
  enlazado):
  - `tsc --noEmit --incremental false`: **pass**, exit 0 en 13 s. Con
    `--listFilesOnly` incluye los 850 archivos del proyecto, entre ellos los
    nuevos.
  - ESLint sobre los 29 `.ts` y `.tsx` del rango: **pass**.
- `pnpm check:agent-page`: **pass** ("Agent page checks passed"), en HEAD y
  en la copia de `01e6226`.
- `pnpm check:agent-sheet`, `check:agent-tools` y `check:agent-proposals`:
  **pass** en HEAD y en la copia de `01e6226`.
- `pnpm exec next build` del líder sobre HEAD `16ff4ae`: **pass**. Salió con
  exit 0 en 39 s, compiló en 11,1 s, pasó TypeScript, generó 29 páginas
  estáticas y listó 38 rutas, entre ellas `ƒ /dashboard/agent` y
  `ƒ /api/agent/chat`. El log está en `scratchpad/next-build-16ff4ae.log`.
  Cubre de la 41 a la 44.
- Arnés `review-42/tree42/review-harness/url-sync.tsx`, con el hook real,
  `react-dom/client` y la réplica de la sesión: 8 de 12 escenarios pasan.
  Fallan S4, S10 y S11 (hallazgo 1) y S12 (hallazgo 3). Con los dos cambios
  del hallazgo 1 aplicados en la copia (y después revertidos), pasan S1 a
  S11.
- Arnés `delete-unmount.tsx`, con TanStack Query real: con la forma de la
  41 corre `onDeleted` y con la de la 42 no (hallazgo 2).
- Arnés `search.ts`: **pass**, 9 casos.
- Mutaciones (`mutate.mjs` y `mutate-with-controls.mjs`): 3 de 3 controles
  detectados y 0 de 9 mutaciones detectadas (hallazgo 4). Después de cada
  corrida verifiqué que los archivos de la copia quedaran restaurados.
- Base de datos: no la consulté, porque ningún hallazgo lo necesitaba.

## Criterios de aceptación

1. **`/dashboard/agent` bajo el layout privado de admin, con "Agente" en el
   sidebar y activo en la ruta: cumplido.**
   - El layout exige ADMIN.
   - El `match` es `startsWith(AGENT_PAGE_PATH)`.
   - Lo cubren el check y el smoke.
2. **Lista todas las conversaciones con búsqueda sin acentos, presupuesto,
   costo, renombrar y borrar, en columna o en diálogo: cumplido, con
   observaciones.**
   - Incluye todas las del usuario, sin filtro de presupuesto, y el
     presupuesto va en la fila.
   - La búsqueda funciona (arnés), y la columna o el diálogo dependen del
     panel (smoke a 1024, 1440 y 390).
   - Tiene el tope de 100 documentado (hallazgo 5).
3. **Contexto del presupuesto en cada turno, con link; las nuevas sin
   contexto: cumplido.** Lo prueban el check, el código y el cuerpo del
   pedido en el smoke.
4. **`?conversacion=` para recargar y abrir links, error con salida para un
   id desconocido y el sidebar arranca una nueva: cumplido, con la
   excepción del hallazgo 1.**
   - Recargar y abrir links funciona (S2 y smoke).
   - Un id desconocido da el error con "Nueva conversación" (S3 y smoke).
   - El sidebar desde una conversación arranca una nueva (S6 y smoke). No
     lo hace desde la pantalla de error ni mientras carga una conversación
     fuera de la lista.
5. **El Sheet conserva su historial por presupuesto y abre la conversación
   en la página, deshabilitado mientras responde: cumplido, con
   observaciones.**
   - Mismas claves y el mismo `ensureStarted`.
   - `check:agent-sheet` en verde.
   - El botón está deshabilitado con `submitted` o `streaming`.
   - Observaciones: los hallazgos 2 y 3, y el 6 en crear.
6. **Modo, habilidades, tarjetas, propuestas, línea de uso, costo y
   diálogo de costos igual que en el Sheet: cumplido.**
   - Son los mismos componentes (`AgentSessionBody`, `AgentChat`,
     `AgentModeSelect`, `AgentCostBadge` y `AgentCostDialog`), y confirmar
     además invalida el historial.
   - El smoke probó el modo, los costos y un turno con su línea de uso.
     Confirmar una propuesta desde la página no se corrió; lo revisé en el
     código.
7. **Checks, TypeScript, lint, build y smoke autenticado en escritorio y
   390x844: cumplido.** Todo en verde y registrado. Los checks tienen los
   huecos del hallazgo 4.

## Evidencia de la prueba autenticada del implementador

- **Alcanza para:**
  - página nueva, turno, dirección y recarga;
  - Sheet, "Abrir en página" y contexto `saved` en el cuerpo del pedido;
  - búsqueda, renombrar y el diálogo de borrar (cancelado), costos y modo;
  - id inexistente e inválido, y sidebar desde una conversación;
  - historial del Sheet de crear y del presupuesto;
  - 1024, 1440 y 390x844, claro y oscuro.
- **Falta, sin bloquear:**
  - borrar de verdad la conversación abierta en la página;
  - atrás y adelante;
  - cambiar de conversación en pleno stream en la página;
  - confirmar una propuesta desde la página;
  - la cabecera del Sheet a 390 px con el botón nuevo;
  - renombrar y borrar desde el historial anidado del Sheet;
  - el 403 de quien no es admin;
  - más de 100 conversaciones.

## Recomendado para la próxima pasada

- **1 y 2.** Son cambios de pocas líneas, y el arreglo del 1 ya está
  probado.
- **4.** Un check de comportamiento para la dirección y las aserciones de
  M3 a M9, sobre todo el filtro por `userId` (M7).
- **3, 5 y 6.** Opcionales, de UX.
- **7.** Confirmarlo en el navegador cuando se pueda.
- **Para reusar el arnés.** Está en
  `scratchpad/review-42/tree42/review-harness/`. Corre con
  `node_modules\.bin\tsx review-harness/url-sync.tsx` desde la copia. Antes
  hay que volver a enlazar `node_modules` como junction
  (`mklink /J tree42\node_modules <repo>\node_modules`): lo saqué al
  terminar, para que borrar el scratchpad no alcance al `node_modules` del
  repo.
