# Implementación - Feature 42 Página del agente

Rama `feature/42-agent-page`, encima de `feature/41-agent-budget-sheet`.
Pedido del usuario el 2026-09-21: la página propia que el plan había dejado
como mejora posterior. Plan en `docs/agent-plan.md` (sección "Feature 42" y
sus ajustes), contrato en `docs/agent.md` (sección "Página").

## Alcance

- Ruta `app/(private)/dashboard/agent/page.tsx` con `<Suspense>` alrededor de
  `AgentPageHost` (lee `?conversacion=` con `useSearchParams`). Entrada
  "Agente" en el sidebar, grupo "Asistente", activa en la ruta.
- `components/agent/agent-page-host.tsx` y `agent-page-header.tsx`: el agente
  a ancho completo, con la columna del historial cuando el panel tiene lugar
  y el diálogo cuando no.
- `hooks/use-agent-page-url.ts`: la dirección y la sesión en los dos
  sentidos.
- `agent-conversation-list.tsx`: la lista del historial, sacada de
  `AgentHistoryDialog` para usarla en el diálogo y en la columna. Las filas
  muestran el presupuesto en la página y la búsqueda lo incluye.
- `agent-open-page-button.tsx`: "Abrir en página" en la cabecera del Sheet.
- `useAgentSession` recibe un `scope` (`lib/agent/conversation-scope.ts`) y
  guarda la conversación leída al abrirla (`conversation`: título, modo y
  presupuesto). `AgentSheetBody` pasó a `AgentSessionBody`.
- Servidor: `agentConversationListSchema` en `schemas/agent.ts` con `all`;
  `getAgentConversations` trae todas (100) con `all` y el presupuesto de cada
  conversación en el select. La ruta del agente y la base no cambian.
- `lib/agent/page-url.ts` y `lib/agent/client-id.ts` (la forma del id, sin
  dependencias, compartida con el schema de la ruta).
- `check:agent-page` nuevo (`scripts/check-agent-page.ts` y
  `agent-page-source-checks.ts`); `check:agent-sheet` ajustado a la sesión
  con `scope`.

## Decisiones

- `/dashboard/agent` y no `/dashboard/agente`: las rutas del dashboard están
  en inglés (`budgets`, `financial`, `email`). Los parámetros en castellano,
  como Finanzas (`?seccion=`).
- La página arranca una conversación nueva; `?conversacion=` abre una. La
  dirección se escribe con `history.replaceState` cuando la conversación está
  lista y guardada: sin ida al servidor, sin remontar el chat (un
  `router.replace` con el host keyed cortaba el stream) y sin entradas en el
  historial del navegador. Un cambio que llega de afuera (el link del
  sidebar) se sigue con `useEffectEvent`.
- Una conversación de un presupuesto manda `{ kind: "saved", budgetId }` en
  cada turno, igual que su Sheet. Las nuevas de la página y las que
  empezaron en crear van sin contexto.
- `persisted` también es verdadero para una conversación leída al abrir: una
  más vieja que las 100 de la lista sigue teniendo costo, modo y título.
- "Abrir en página" se deshabilita mientras responde (`useChat({ chat })`
  para leer el estado): navegar corta el stream.
- La columna del historial depende del ancho del panel (container query
  `@4xl/panel`), no de la ventana.

## Hallazgos del smoke y correcciones

- Con `lg`, a 1024 px con el sidebar abierto el chat quedaba en 383 px y la
  cabecera se cortaba. Pasó a container queries: el historial aparece con
  56rem de panel y la cabecera va en una fila desde 36rem de chat.
- El placeholder "Buscar por título o presupuesto…" no entraba en la columna
  de 20rem: ahora "Título o presupuesto…", con el texto completo en el
  `aria-label`.
- Todo el dashboard scrollea 80 px de más (el wrapper del sidebar es
  `min-h-svh` debajo del nav). No se tocó el layout global; los scrolls del
  agente llevan `overscroll-contain` para que la rueda al final de la lista no
  arrastre la página.
- El sidebar importaba `page-url.ts`, que importaba el schema del agente con
  zod: la forma del id pasó a `lib/agent/client-id.ts`.

## Verificación

- PASS: `check:agent-page` (nuevo) con prueba de mutación, 16 de 16: entrada
  del historial sin presupuesto, contexto de la página, query keys, id sin
  validar o con patrón laxo, schema sin `all`, dirección escrita durante la
  carga, `router.replace`, reabrir la conversación que la sesión escribió,
  historial sin `all` o sin presupuesto, abrir en página durante el stream,
  sin Suspense, host sin contexto, sesión sin la conversación leída y
  sidebar sin la entrada.
- PASS: regresiones `check:agent-sheet`, `check:agent-tools` y
  `check:agent-proposals`.
- PASS: `pnpm exec tsc --noEmit`, `.\init.ps1` (harness, `prisma validate` y
  ESLint completo) y `pnpm exec next build` (38 rutas, con `/dashboard/agent`).
- PASS: smoke autenticado en el navegador integrado contra el `next dev` que
  ya corría en el puerto 3000, con OpenAI real (US$ 0,0033 en total):
  - Sidebar → Agente: conversación nueva, "Sin presupuesto", sugerencias. Un
    turno en Bajo: respuesta, línea de uso, título del modelo, la
    conversación en la columna y la dirección con `?conversacion=`. Recargar
    la reabre con sus mensajes y su modo.
  - En "Edificio Guaraní durazno y jackson": el Sheet arranca una nueva, un
    turno responde 1 visita por semana y 2,5 horas (como el presupuesto),
    "Abrir en página" está deshabilitado mientras responde y después lleva a
    la misma conversación en la página, con el link al presupuesto en la
    cabecera y el presupuesto en la fila.
  - Un turno desde la página manda `context: { kind: "saved", budgetId }` (se
    leyó el cuerpo del pedido) y la respuesta cita el precio del presupuesto
    ($ 5.490,00 sin productos, igual que la vista). De vuelta en el
    presupuesto, el Sheet retoma esa conversación con los 4 mensajes.
  - Lista: "guarani" encuentra la conversación por su presupuesto,
    "CAPACIDADES" sin distinguir mayúsculas, "zzz" da el vacío. Renombrar
    actualiza la fila y devuelve el foco al botón de la fila; el diálogo de
    borrar abre con su texto y Cancelar no borra nada. Costos de IA desde la
    página. Cambiar el modo se guarda (fila y recarga).
  - `?conversacion=noExiste12345678`: "Conversación no encontrada" con
    Reintentar y "Nueva conversación", que arranca una y limpia la dirección.
    `?conversacion=../../x`: arranca una nueva y limpia la dirección. El link
    del sidebar, estando en una conversación, arranca una nueva.
  - Sheet de crear: "Abrir en página" va a la página sin id y el historial
    lista las conversaciones sin presupuesto, incluida la general de la
    página. El del presupuesto lista solo la suya.
  - 1024x768 (sidebar abierto): sin columna, chat de 720 px. 1440x900:
    columna de 20rem. 390x844: sin desborde horizontal, historial en diálogo
    ("Todas tus conversaciones con el agente."), targets de 44 px (el link al
    presupuesto mide 24). Claro y oscuro; consola sin errores ni
    advertencias.
- Datos: quedan las dos conversaciones de prueba ("Prueba de la página del
  agente" y "Visitas y horas presupuestadas semanalmente"), para borrar desde
  la página. Durante el smoke apareció otra conversación con la misma cuenta
  ("Presupuesto de oficina 3 días semanales", 12:06, Medio) que no salió de
  la pestaña del smoke; no se tocó.
- NOT RUN: confirmar una propuesta desde la página (el flujo es el del
  Sheet; lo propio de la página es invalidar el historial al confirmar,
  cubierto por lectura de código), cambiar de conversación en pleno stream
  (la sesión es la del Sheet, verificado en la 41) y el tope de 100
  conversaciones (la base tiene 3).
