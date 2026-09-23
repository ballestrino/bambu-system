# Current Harness Session

Status: in_progress

## Agente de Bambú (features 38-44)

- Plan aprobado en `docs/agent-plan.md`; contrato vivo en `docs/agent.md`.
  Orden: 38 → 39 → 40 → 41 → 42 → 43 → 44, cada una en su rama. Se marcan
  `in_progress` recién cuando la 35 libere el único slot, así que las siete
  siguen `pending` en `feature_list.json`. La 42 (la página del agente), la
  43 (editar y guardar los presupuestos del agente) y la 44 (reglas de
  precio) las pidió el usuario el 2026-09-21.
- Supuestos a confirmar con el usuario si hace falta: modo por conversación con
  default Medio, habilidad por mensaje con default General, costos en USD.
- Revisiones (2026-09-18): tres revisores independientes, uno por feature,
  pidieron cambios en las tres (`progress/review_*.md`). Las correcciones
  están en la rama `feature/40-agent-proposals` (encima de las tres) y en la
  sección "Correcciones de la revisión" de cada `impl_*.md`. La re-revisión
  sobre `b6becae` aprobó las tres; sus menores nuevos (título al regenerar y
  aserciones faltantes) quedaron resueltos en el commit siguiente.
- Revisiones (2026-09-22): cuatro revisores independientes, uno por feature,
  sobre `16ff4ae`. Aprobaron la 41, la 42 y la 44 con menores; la 43 pidió
  cambios con tres bloqueantes (`progress/review_*.md`). Las correcciones
  (los tres bloqueantes y los menores chicos de las cuatro) están en la rama
  `feature/44-agent-pricing-rules` y en la sección
  "Correcciones de la revisión" de cada `impl_*.md`. PASS: los once checks
  del agente, oficiales y mail, 34 de 34 mutaciones, `tsc`, `.\init.ps1` y
  `pnpm exec next build`. NOT RUN: smoke en el navegador (el navegador
  integrado no tiene sesión y entrar la contraseña le toca al usuario).
- Re-revisión de la 43 (2026-09-22, sobre las correcciones todavía sin
  commitear): APPROVED. Los tres bloqueantes y los menores quedaron
  resueltos, con 16 de 16 mutaciones detectadas. Las correcciones de 41-44 se
  commitearon después, a pedido del usuario: `b58fe4b` (`fix(agent)`) y el
  `docs(progress)` que le sigue, encima de `16ff4ae`.
- Siguiente paso: el smoke autenticado de las correcciones (sobre todo de la
  43: un aporte vacío guardado, "Confirmar" con un borrador y "Ver detalle",
  y el turno siguiente a guardar una propuesta editada), que necesita la
  sesión del usuario, escribe en la base y gasta OpenAI. Decisiones del
  usuario que dejaron las revisiones: precios con centavos de los guardados
  de antes de la 44 (44), medir Emails en Bajo y Alto o subir `maxDuration`
  (44) y "Abrir en página" desde el Sheet de crear (42).
- Para cerrar de la 38 a la 44 falta la decisión del usuario de pasarlas a
  `done` con la 35 todavía en `in_progress`. Decisiones abiertas:
  `engines`/Node del deploy y `maxDuration` (con el consumo guardado por
  paso).

### Feature 38 - `ai_model_gateway`

- Implementada y verificada en la rama `feature/38-ai-model-gateway` (desde
  `main`). Detalle en `progress/impl_ai_model_gateway.md`. La revisión
  (`progress/review_ai_model_gateway.md`) pidió cambios: el parser de
  `AI_PRICE_*` inventaba precios con campos vacíos. Corregido y aprobado en la
  re-revisión; falta el cambio de estado.
- `lib/ai/**`: modos Bajo/Medio/Alto (Luna xhigh, Terra high, Sol medium),
  overrides por entorno, proveedores perezosos de OpenAI y del Vercel AI
  Gateway, settings con `store: false`, precios reales de OpenAI y costo
  estimado en USD.
- Cambios contra el plan, ya anotados en `docs/agent-plan.md`: el título usa
  `none` porque gpt-5.6 no acepta `minimal`, y el uso y los precios suman la
  escritura de caché (1,25 veces la entrada).
- PASS: `check:ai-gateway`, prueba de mutación, `tsc`, `.\init.ps1`,
  `pnpm exec next build` y un turno real por modo contra OpenAI.
- Para la 39: `AgentUsageEvent` guarda también `cacheWriteTokens`. Con el
  gateway, `readGatewayCost` se lee por paso y se suma. Si
  `estimateUsageCost` lanza por un `AI_PRICE_*` mal escrito, la persistencia
  del uso no tiene que tirar el turno.
- Pendiente fuera del código: confirmar que Vercel usa Node 22.x o 24.x.

### Feature 39 - `agent_core_skills_and_stream`

- Implementada y verificada en la rama `feature/39-agent-core` (encima de la
  38). Detalle en `progress/impl_agent_core_skills_and_stream.md`. La
  revisión pidió cambios: `calculateBudget` aceptaba IVA 0 y calculaba con
  22. Corregido junto con los menores y aprobado en la re-revisión; falta el
  cambio de estado.
- Persistencia `Agent*` con migración aditiva, núcleo en `lib/agent/**`, 14
  tools sin escrituras, cuatro habilidades, `draftEmail` con validación de
  precios y Literal E, historial y costos en `data/agent/**`, acciones de
  conversación y la ruta `POST /api/agent/chat`.
- La migración `20260918120000_agent_workspace` ya está aplicada, con
  confirmación del usuario, en la base del `.env` (Neon
  `br-sparkling-night-acqea90i`, 20/20).
- Hallazgo de la prueba real: con campos opcionales el modelo inventaba
  valores y erraba el precio. Las entradas de las tools son ahora
  obligatorias y nullable; el mismo pedido pasó de 5 tools y 31 s con precio
  errado a 1 tool y 8 s con el correcto.
- PASS: `check:agent-tools`, regresiones de finanzas, oficiales y mail, `tsc`,
  `.\init.ps1`, `next build` y la prueba autenticada con OpenAI (números
  iguales a Finanzas y a Pagos, correo con fuentes, Alto con Sol, formulario
  sin guardar, corte, regenerar y acciones). Gasto de la prueba: US$ 0,20.
- Para la 40: las propuestas agregan `AgentProposal`, las tools `propose*`
  (con entradas nullable) y el bloque "Propuestas de esta conversación" del
  prompt. Hasta entonces la habilidad Presupuestos dice que no puede guardar.
- Decisión pendiente: `maxDuration` es 60. El turno más largo medido fue de
  38,9 s en Medio; con Fluid compute confirmado conviene subirlo a 300.

### Feature 40 - `agent_proposals`

- Implementada en la rama `feature/40-agent-proposals` (encima de la 39).
  Detalle en `progress/impl_agent_proposals.md`; contrato en `docs/agent.md`
  (sección "Propuestas") y ajustes en `docs/agent-plan.md`.
- `AgentProposal` con migración aditiva `20260918180000_agent_proposals`,
  cuatro tools `propose*` que guardan PENDING sin escribir presupuestos,
  `confirmAgentProposal` (claim atómico, re-validación contra una lectura
  fresca, acciones existentes, CONFIRMED o FAILED, idempotente),
  `rejectAgentProposal`, `listAgentProposals`, vencimiento a 24 horas y
  auditoría `proposal.*`.
- Avisos de guardar cambios: opciones recreadas (con los trabajos que pierden
  el vínculo a su opción, porque `Job.sourceBudgetOptionId` es SET NULL),
  versión oficial N+1, dirección nueva, opción con productos y precios
  guardados que no salen del cálculo.
- PASS: `check:agent-proposals` con 9 de 9 mutaciones detectadas, regresiones
  de agente, oficiales, mail y finanzas, `tsc`, `.\init.ps1` y `next build`.
- La migración `20260918180000_agent_proposals` ya está aplicada, con
  confirmación del usuario, en la base del `.env` (21 de 21).
- PASS: prueba autenticada con OpenAI (US$ 0,0635): crear, guardar el margen
  y duplicar, cada uno con precios iguales a la tarjeta. Confirmar repetido
  o en paralelo escribe una sola vez; un presupuesto cambiado falla sin
  tocar nada; rechazar, vencer y regenerar se comportan como se esperaba.
  Todo quedó auditado y los datos de prueba se borraron (200 presupuestos).
- Hallazgo de la prueba: el modelo creía pendientes propuestas ya resueltas
  (la salida guardada de la tool dice PENDING). Corregido con el estado vivo
  en el historial que ve el modelo y los cambios en cada línea del bloque.
- La revisión pidió cambios: con IVA 0 lo guardado no era la tarjeta, y había
  una carrera entre la re-validación y `updateBudget`. Corregidos (con
  compare-and-set en `updateBudget`) junto con los menores y aprobados en la
  re-revisión; falta el cambio de estado.
- Para la 41: mostrar una EXECUTING vieja como resultado desconocido, no
  presentar como exacto el número de trabajos vinculados, aceptar la
  respuesta de confirmar sin `proposal` (conversación borrada en el medio) y
  cubrir en el smoke el 403 de un usuario logueado que no es admin.
- Para la 41: la tarjeta lee el estado vivo con `listAgentProposals`, no la
  salida guardada de la tool, y al confirmar invalida presupuestos,
  oficiales y propuestas. Un `result.slug` distinto del actual implica
  redirigir, igual que el formulario de edición.

### Feature 41 - `agent_budget_sheet` (aprobada con menores, corregidos)

- Rama `feature/41-agent-budget-sheet`, encima de la 40. Sigue `pending` en
  `feature_list.json` por el mismo motivo que 38-40 (la 35 ocupa el slot).
- Diseño: el host del Sheet es dueño de la sesión (una instancia `Chat` del
  AI SDK guardada en estado), así cerrar y reabrir el Sheet no corta ni
  pierde la conversación. El transport es un módulo fijo y el modo, la
  habilidad y el contexto viajan con cada `sendMessage`, sin refs.
- En un presupuesto guardado se retoma la última conversación; en crear se
  arranca una nueva. El formulario se lee al enviar (`getValues`), no en
  cada tecla, y los campos inválidos no viajan (el servidor usa los
  defaults).
- Implementado: `components/agent/**` (Sheet, modo, habilidades, tarjetas,
  propuestas, historial, costos), acciones `actions/agent/usage.ts` y
  `settings.ts`, helpers puros (`chat-request`, `form-context`,
  `usage-format`, `proposal-outcome`) y el retiro del chat viejo. Feature 7
  marcada como reemplazada por la 41 y la 5 acotada a Resend y Cloudinary.
- PASS: `check:agent-sheet` (nuevo), regresiones `check:agent-tools`,
  `check:agent-proposals`, `check:ai-gateway`, `check:official-budgets` y
  `check:mail-agent`, `tsc`, `pnpm lint`, `pnpm harness` y
  `pnpm exec next build` (37 rutas, sin `/api/ai-chat/stream`).
- PASS: smoke autenticado (navegador integrado, `next dev` del puerto 3000 y
  un `next start` de prueba en el 3100 para el error sin clave y el modelo
  sin precio), con OpenAI real por US$ 0,24. Detalle en
  `progress/impl_agent_budget_sheet.md`. Los datos de prueba se borraron
  desde la UI: 200 presupuestos, 0 conversaciones, 0 propuestas.
- El smoke encontró y se corrigió: numeración y saltos de línea del
  Markdown, chip de habilidad que se reiniciaba, foco perdido al renombrar
  desde el menú, selector de modo de 32px en el teléfono, meses con "De",
  uso sin precio mostrado como US$ 0,00 y respuesta detenida sin marca
  después de recargar.
- Límite documentado: una respuesta detenida a mitad de un paso no registra
  el consumo de ese paso (OpenAI lo informa al terminar la respuesta).
- NOT RUN: 403 de un usuario logueado que no es admin (no hay uno) y la
  redirección por cambio de dirección del presupuesto abierto (cubierta por
  lectura de código).
- Commiteada el 2026-09-21 (`e4b89c8` y `595870c`) a pedido del usuario,
  después de volver a pasar harness, ESLint, `tsc` y `check:agent-sheet`.
- Revisión (2026-09-22, `progress/review_agent_budget_sheet.md`): APPROVED.
  Tres menores corregidos en el `fix(agent)` de 41-44: "+ sin precio" en la
  fila del historial, reglas de la tarjeta de propuesta puras y con prueba,
  y links `//dominio` externos.

### Feature 42 - `agent_page` (aprobada con menores, corregidos)

- Rama `feature/42-agent-page`, encima de la 41. Commiteada el 2026-09-21
  (`35e5c22` y `01e6226`). Sigue `pending` por lo mismo que 38-41. Detalle en
  `progress/impl_agent_page.md`.
- `/dashboard/agent` con "Agente" en el sidebar: el mismo agente a ancho
  completo, con todas las conversaciones (las 100 más recientes) en una
  columna que depende del ancho del panel, o en el diálogo de historial.
  Una conversación de un presupuesto manda ese presupuesto como contexto y
  linkea a él; las nuevas van sin contexto.
- La conversación guardada va en `?conversacion=` (con `replaceState`, sin
  remontar el chat). El Sheet tiene "Abrir en página", deshabilitado
  mientras responde. `useAgentSession` recibe un `scope`.
- PASS: `check:agent-page` (nuevo, 16 de 16 mutaciones), `check:agent-sheet`,
  `check:agent-tools`, `check:agent-proposals`, `tsc`, `.\init.ps1` y
  `pnpm exec next build` (38 rutas).
- PASS: smoke autenticado con OpenAI real (US$ 0,0033): página nueva, turno,
  dirección, recarga, Sheet → "Abrir en página", contexto `saved` en el
  cuerpo del pedido, búsqueda sin acentos, renombrar, diálogo de borrar,
  costos, modo, id inexistente o inválido, link del sidebar, historial del
  Sheet de crear y del presupuesto, 1024, 1440 y 390x844, claro y oscuro.
- Quedan dos conversaciones de prueba para borrar desde la página. Apareció
  otra con la misma cuenta ("Presupuesto de oficina 3 días semanales") que
  no salió del smoke; no se tocó.
- Revisión (2026-09-22, `progress/review_agent_page.md`): APPROVED. Corregidos
  en el `fix(agent)` de 41-44: la dirección desde el error o mientras abre
  otra, el borrado desde un historial que se cierra, "Abrir en página" antes
  de que la conversación figure guardada, el aviso del tope y los huecos del
  check.
  Quedan: "Abrir en página" desde el Sheet de crear (decisión del usuario) y
  un `replaceState` durante una navegación pendiente (a confirmar).

### Feature 43 - `agent_budget_editor` (aprobada en la re-revisión)

- Rama `feature/43-agent-budget-editor`, encima de la 42. Sigue `pending`
  por lo mismo que 38-42. Detalle en
  `progress/impl_agent_budget_editor.md`.
- Las tarjetas de cálculo y de propuesta de crear tienen "Ver detalle" y
  "Editar": un Sheet con el detalle de la página del presupuesto y el
  formulario del generador sobre los mismos valores, y "Guardar en el
  generador".
- Guardar deja una propuesta CREATE_BUDGET de esa llamada a tool (nueva o
  revisada) y la confirma con `confirmAgentProposal`: auditado, una sola
  escritura, y el agente lo ve después. `values` viaja en la salida de las
  tools para la UI y `toModelOutput` se lo saca al modelo.
- PASS: `check:agent-budget-editor` (nuevo, 20 de 20 mutaciones), las
  regresiones del agente, oficiales y mail, `tsc`, `.\init.ps1` y
  `pnpm exec next build`.
- PASS: smoke autenticado con OpenAI real (unos US$ 0,03): detalle igual a
  la tarjeta, edición en vivo, borrador al cerrar y reabrir, nombre vacío y
  tomado, guardar un cálculo y una propuesta editada, el agente conoce lo
  guardado, editor encima del Sheet de Presupuestos, recarga, 390x844, claro
  y oscuro.
- El smoke encontró y se corrigió: doble scroll en el detalle, foco en
  `BODY` al cerrar encima del Sheet, un cálculo guardado que se reabría con
  los valores del agente y targets de 16 y 37 px en el teléfono.
- Datos: con permiso del usuario quedaron "Prueba agente 43 cálculo" y
  "Prueba agente 43 propuesta" en el generador, para borrar.
- Commiteada el 2026-09-21 (`a4311e3` y `40c586d`) a pedido del usuario,
  después de volver a pasar harness, ESLint, `tsc` y
  `check:agent-budget-editor`.
- Revisión (2026-09-22, `progress/review_agent_budget_editor.md`):
  CHANGES_REQUESTED. Bloqueantes:
  - un aporte en 0 % se guardaba con el porcentaje por defecto;
  - un borrador se mostraba sobre una propuesta ya guardada;
  - el modelo leía como confirmado el resumen de antes de editar.

  Los tres están corregidos, con sus aserciones, igual que los menores
  recomendados.
- Re-revisión (2026-09-22, al final de
  `progress/review_agent_budget_editor.md`): APPROVED. Los scripts de la
  primera revisión ahora dan lo mismo que el editor (aportes en 0 y vacíos)
  y lo guardado para el modelo. Uno nuevo prueba los borradores con el hook
  y react-hook-form reales. Mutaciones: 16 de 16. Dos menores nuevos: el
  texto "antes de volver a guardarlo" con resultado desconocido (desde el
  editor no se puede) y un `requireAdminSession()` doble por guardado.
  NOT RUN: el smoke autenticado de las correcciones.

### Feature 44 - `agent_pricing_rules` (aprobada con menores, corregidos)

- Rama `feature/44-agent-pricing-rules`, encima de la 43. Sigue `pending`
  por lo mismo que 38-43. Detalle en `progress/impl_agent_pricing_rules.md`.
- Pedido del usuario: nada de precios con números raros, precio lindo
  moviendo el presupuesto hasta $ 100, productos en múltiplos de $ 500,
  buscar si ya existe uno igual, y responder un mail que pide presupuesto
  con el precio (generándolo si no existe). Decidido con el usuario: el
  precio sube siempre al próximo múltiplo de $ 100 y los productos van al
  múltiplo de $ 500 más cercano, con mínimo de $ 500.
- El redondeo lo hace el cálculo (`applyAgentChanges`), no el prompt:
  `draftEmail` solo acepta importes de una tool. Lo usan `calculateBudget` y
  las propuestas de crear y guardar. No redondea un margen pedido, un precio
  objetivo, un guardado que solo se abre ni lo editado a mano en la 43.
- Un presupuesto nuevo estima transporte y productos con sus horas (antes
  quedaban los de 1 visita semanal: se vio en el smoke de la 43). El precio
  por hora va en pesos.
- `findMatchingBudgets` busca guardados con el mismo servicio; la propuesta
  de crear avisa si hay. Emails suma esa tool y `proposeCreateBudget`.
  `MAX_STEPS` pasa de 6 a 8.
- PASS: `check:agent-pricing` (nuevo, 19 de 19 mutaciones), regresiones del
  agente, oficiales y mail, `tsc`, `.\init.ps1` y `pnpm exec next build`.
- PASS: smoke autenticado con OpenAI real (unos US$ 0,18): presupuesto que ya
  existe (usa el guardado), uno nuevo ($ 54.062,33 → $ 54.100,00, productos
  $ 5.500), margen 40 % sin redondear, mail para un servicio nuevo (calcula,
  redacta y propone; 6 pasos, 26 s) y mail para uno que existe (precio
  guardado, sin propuesta).
- Datos: quedaron dos conversaciones de prueba ("Presupuesto de limpieza de
  oficina" y "Cotización de limpieza para ferretería") y dos propuestas de
  crear pendientes, que vencen solas en 24 horas. No se guardó ningún
  presupuesto.
- Commiteada el 2026-09-22 (`bfca3b0` y `16ff4ae`) a pedido del usuario,
  después de volver a pasar harness, ESLint, `tsc`, `check:agent-pricing` y
  las regresiones del agente, oficiales y mail.
- Revisión (2026-09-22, `progress/review_agent_pricing_rules.md`): APPROVED,
  sin bloqueantes. Corregidos en el `fix(agent)` de 41-44:
  - productos solos no redondean;
  - costo de más de $ 1.000.000;
  - "y más" en el aviso;
  - `PRICE_RULE` con `findMatchingBudgets`;
  - búsqueda pura y con prueba;
  - lo editado con un aporte en 0.

  Quedan para el usuario los precios con centavos de los guardados de antes
  y medir Emails en Bajo y Alto (o subir `maxDuration`).

## Feature 37 - Sueldos a mes vencido

- Feature 37 - `ops_payroll_paid_in_arrears`, sin commitear en `main`. Queda
  `pending` por lo mismo que la 36: la 35 ocupa el único `in_progress`.
- Los pagos a empleadas se siguen contando en el mes en que se hacen:
  `assignedMonth`, el Resumen, la tendencia, Costes y el PDF no cambian.
- Lo que cambia es contra qué se compara el saldo. En Finanzas → Pagos,
  `/dashboard/payroll` y la ficha de la empleada, el mes M compara los pagos
  de M contra las visitas realizadas de M−1 (horas, sugerido, devengamientos y
  saldo). La regla vive en `getPayrollWorkMonth` (`lib/ops/finance`), y
  `getPayrollPeriod` arma el rango y los nombres de mes.
- Finanzas tiene una query propia, `payrollOccurrences`, que solo se activa
  en Pagos. Usa el mismo scope que la query mensual de M−1, así que comparten
  caché. Cobros y Resumen siguen leyendo las visitas de M.
- `PayrollDialog` ya no recibe `periodStart`/`periodEnd`: calcula solo el mes
  asignado (M) y el período trabajado (M−1). Así también se corrige el acceso
  de la ficha de la empleada, que abría el diálogo sin período.
- En la ficha de la empleada, "Periodo desde/hasta" pasó a "Pagos
  desde/hasta": esas fechas eligen el mes de los pagos, no el período trabajado.
- `es-UY` escribe "setiembre", y el mes suelto en mayúscula ("Agosto"). Por
  eso se pasa a minúscula, porque va en medio de la frase.

### Verificación de la 37

- PASS: `check:finance` (con el mes anterior y el cruce de año),
  `check:finance-tables`, `check:finance-trend`, `tsc` y el lint de las carpetas
  tocadas.
- PASS: recálculo de solo lectura contra la base con las mismas funciones de la
  pantalla. Setiembre pasa de sugerido 49.132 (horas de setiembre en curso) a
  120.858 (horas de agosto), con pagado 0 y saldo 120.858. Agosto pasa a
  comparar sus 100.296 pagados contra julio.
- NOT RUN: smoke en navegador. Ni el navegador integrado ni Chrome tenían
  sesión en `localhost:3000`.
- Datos: julio tiene 141 visitas `DONE` sin hora real, así que su sugerido da
  772 y agosto muestra saldo −99.524. Es un hueco de carga previo a este cambio,
  no un error de cálculo. Además, los pagos de agosto (del 6 al 28) tienen
  período 1–31 de agosto, aunque pagan julio. Eso no afecta a Finanzas, que
  usa `assignedMonth`, pero sí al resumen por período de la empleada, que
  filtra por período.

## Feature 36 - Tablas buscables en Finanzas

- Feature 36 - `ops_finance_searchable_tables`, en la rama
  `finanzas-dashboard-navegacion`. Verificación en verde y commiteada, pero
  **sigue `pending`** hasta el cierre de sesión: la 35 ocupa el único
  `in_progress`.
- Cobros, Costes y Pagos dejaron las tarjetas y los `OpsScrollContainer`: cada
  uno es una tabla compacta con encabezados ordenables (`aria-sort`), 25 filas
  por página y un pie con conteo y total registrado. Reemplaza el criterio de
  la 28 que pedía conservar el scroll interno.
- Un solo buscador por sección, dentro de la toolbar de filtros. No distingue
  acentos ni mayúsculas y busca montos crudos y formateados (`12900`,
  `12.900`). "Limpiar" también lo vacía.
- El normalizador estaba copiado tres veces y la copia de `data/ops/shared.ts`
  es `server-only`. Pasó a `lib/search-text.ts`, y los dos selects y `data/`
  delegan en él.
- Cobros y Pagos muestran una tabla a la vez con un selector de vista en
  `?vista=` (`equipo`, `registrados`). Cambiar de vista hace `replace()`, no
  `push()`. "Ver todo" del Resumen abre `?seccion=cobros&vista=equipo`.
- Los diálogos se montan por fila y solo mientras están abiertos (`trigger={null}`
  más `defaultOpen`). Antes había un `PaymentDialog` y un `DeleteDialog` por
  tarjeta. Radix devuelve el foco al trigger, que acá no existe, así que
  `useRowDialog` se lo devuelve al botón que abrió el diálogo.
- Debajo de `sm` el monto y las acciones se pliegan en la primera celda
  (`OpsRowMobileAside`). Sin eso la tabla desbordaba 62px a 390px.
- `useOpsTableState` guarda la página junto con la firma de query, orden y
  filtros. Si la firma cambia vuelve a la página 1 sin `useEffect`. El hook no
  expone refs: `react-hooks/refs` marca cualquier objeto que contenga una.
- La toolbar de Costes apilaba sus cuatro selects `w-full` en filas completas
  desde `lg`. Ahora comparten una línea.
- Sin cambios en `/payments`, `/costs`, `/payroll`, la ficha del trabajo ni la de
  la empleada: las props nuevas de diálogos, filtros y resúmenes son opcionales.

### Verificación de la 36

- PASS: `check:finance-tables` (nuevo), `check:finance`, `check:finance-trend`,
  `check:finance-pdf`, `check:employee-accruals`, `check:profitability`, `tsc`,
  lint completo, `pnpm exec next build` y `pnpm harness`.
- PASS: smoke autenticado en Chrome, agosto 2026, en oscuro y claro. Esto cubrió:
  - La búsqueda (`maria` encuentra María, `15.337` y `9637` encuentran el
    monto, sin resultados ofrece limpiar).
  - El orden, la página 2 (26–33 de 33) y el cambio de vista.
  - Back y forward, "Ver todo" y la fila expandible de Pagos.
  - Editar y "Registrar pago" abren precargados y el saldo sugerido es 12844.
    Anular abre la confirmación. Todos se cancelaron sin guardar.
  - El foco vuelve al botón que abrió el diálogo, incluido el cierre con Escape.
  - Los estados de carga (skeleton con `aria-busy`) y vacío.
- PASS: los totales del pie de Por empleada coinciden con los KPIs (sugerido
  120.858, pagado 100.296, saldo 20.562).
- PASS: 390x844 emulado con un iframe del mismo origen, porque `resize_window`
  sigue sin cambiar el viewport. En las cinco vistas no hay overflow horizontal
  y los targets miden 44px.
- PASS: regresión de `/dashboard/payments`, `/costs`, `/payroll`, la ficha del
  trabajo y la ficha de la empleada. Siguen con sus tarjetas y botones.
- Consola: solo la advertencia de hidratación de una extensión
  (`cz-shortcut-listen`) y la de `Description` en los diálogos de alta y edición,
  que ya estaba antes.

## Active Feature

- Feature 28 - `ops_finance_task_navigation`. El código está implementado y
  commiteado en la rama `finanzas-dashboard-navegacion`, pero **sigue `pending`
  en `feature_list.json`**: falta el smoke a 390x844 que pide su criterio 7, y
  la 35 todavía ocupa el único lugar de `in_progress`.

### Lecturas sin escrituras

- `getOperationalCostCategories` ya no siembra las cuatro categorías por defecto
  en cada lectura y `getOpsCostSettings` usa `findUnique` en vez de `upsert`.
  Abrir Finanzas hacía 5 escrituras en la base; ahora hace cero.
- El sembrado pasó a `actions/ops/cost-category-defaults.ts`, detrás de una
  acción explícita de admin que se ofrece desde un empty state en el panel de
  categorías. Una base nueva se resuelve con un click.
- `getOpsCostSettings` devuelve `null`, nunca `undefined`: React Query rechaza
  `undefined`, y una fila sintética con `updatedAt` móvil cambiaría el `key` de
  `BpsSettingsPanel` en cada refetch, remontando el form y borrando lo tipeado.
  El `upsert` de `updateOpsCostSettings` es legítimo y quedó.

### Navegación por secciones

- Las cinco secciones dejaron de apilarse en un scroll único. Hay un `tablist`
  con roving tabindex en desktop y un `<select>` nativo en mobile, con la sección
  activa en `?seccion=`.
- Activación manual, no automática: las flechas mueven foco y Enter activa. Con
  activación automática cada flecha metería una entrada de historial.
- Los hashes viejos (`#rentabilidad`, `#costes`) se migran al query param en un
  efecto de montaje. El fragmento no llega al servidor y `useSearchParams` no lo
  ve; leerlo durante el render rompería la hidratación.
- `<Suspense>` va en el Server Component. Sin eso `next build` falla.
- El header bajó de seis acciones a dos. Los tres diálogos de alta ya viven en su
  propia sección, y la configuración de costes pasó a un sheet secundario.

### Carga diferida

- `useJobs`, `useEmployees`, `useJobOccurrences` y `useOperationalCostCategories`
  toman un `enabled` posicional al final, calcado del que `useJobProfitability`
  ya tenía. Retrocompatible: ningún otro call site cambió.
- `financeSectionQueries` mapea qué pide cada sección. Las cuatro queries de
  dinero del mes nunca se gatean: alimentan el resumen de cada tab y el PDF, que
  se exporta desde cualquiera.
- Resumen carga categorías y empleadas porque sus accesos rápidos abren esos
  mismos diálogos.

### Dashboard del Resumen

- Nueve tarjetas de igual peso → hero de tres (Cobrado, Egresos, Resultado) a
  todo el ancho, y dos columnas `xl:[minmax(0,1.6fr)_minmax(0,1fr)]`.
- El `minmax(0,...)` no es cosmético: dentro de un track `1fr` por defecto el
  `ResponsiveContainer` de recharts mide cada vez más ancho y nunca encoge.
- El gráfico de tendencia absorbe también la composición (egresos apilados), así
  no hacen falta dos gráficos.
- El desglose de egresos suma los pagos a empleadas como fila sintética, de modo
  que las filas dan exactamente `summary.totalCosts`: reconcilia con el hero por
  construcción, no por coincidencia.
- La paleta `--chart-*` clara eran los defaults de shadcn (Cobrado salía rojo) y
  no compartía matiz con la oscura, afinada a mano en bambú. Se re-afinó la clara
  a los mismos matices para que una serie conserve su identidad al cambiar tema.

### Tendencia de 3 meses (read-only)

- `getFinanceTrend` agrega por `assignedMonth` con cuatro `groupBy` en paralelo.
  Es el único read agregado de `data/`: doce números no deberían costar cientos
  de filas, y las tres tablas ya indexan `[status, assignedMonth]`.
- El rango se arma con `getAssignedMonthRange`, o sea el mismo predicado que ve
  `getFinancialSummary`, y cada bucket se pasa por `getFinancialSummary` en vez
  de re-derivar totales. La aritmética no puede divergir de la tarjeta del mes.
- `bpsEstimatePercent` queda en 0 a propósito: el estimado depende de settings
  que el cliente ya tiene, y calcularlo acá también lo contaría doble.
- Bucketing en UTC con `getFinanceMonthKey`. `getMonthKey` daría el mes anterior
  para `2026-09-01T00:00:00Z` en UTC-3.
- `financeTrendRoot` se invalida desde `invalidateJobScopes`,
  `invalidateEmployeeScopes` y `invalidateCosts`.

### Verificación

- PASS: `check:finance-trend` (nuevo, incluye la reconciliación con
  `getFinancialSummary`, la exclusión de VOIDED, los meses en cero y el bucketing
  UTC), `check:finance`, TypeScript, lint completo, `next build` (37 rutas) y
  `pnpm harness`.
- PASS: smoke autenticado en desktop, claro y oscuro. Los cinco `?seccion=`, los
  hashes legacy migrando, back/forward coherente, teclado (ArrowRight mueve foco
  sin activar, Enter activa, Home salta al primero), ARIA cruzado
  (`aria-controls`/`aria-labelledby`), targets de 44px, sin overflow horizontal,
  y consola sin errores ni warnings de hidratación.
- PASS: recorrida de los cinco tabs con recarga completa. Ninguna sección quedó
  con listas vacías por gating de más.
- PASS: prueba del `minmax(0,...)`. Al angostar el contenedor el gráfico pasa de
  721 a 473px y vuelve a 721. No hay ratchet de ancho.
- `pnpm build` completo no corre mientras haya un `pnpm dev` levantado:
  `prisma generate` no puede renombrar `query_engine-windows.dll.node`. Se usó
  `pnpm exec next build`, que sí pasa.

## Blocked Verification

- NOT RUN: 390x844. `resize_window` no cambia el viewport en este Chrome, el
  mismo bloqueo que ya había registrado la feature 35. Se verificó
  estructuralmente: el tablist es `hidden md:flex`, el selector mobile es un
  `<select>` nativo de 5 opciones dentro de un `label md:hidden`, todos los
  targets miden 44px y no hay overflow horizontal. **Falta mirarlo a ancho real**
  antes de cerrar la 28.
- NOT RUN: prueba de cero escrituras contra la base. El cambio está verificado
  por lectura de código y el panel de BPS muestra el valor real guardado (33),
  pero no se comparó `updatedAt` antes y después de cargar Finanzas tres veces.

## Paused Feature

- Feature 35 - `ops_weekly_schedules` sigue `in_progress`. Su código quedó
  commiteado (`b598c09`) con todos sus checks en verde
  (`check:schedule`, `check:schedule-availability`, `check:schedule-move`,
  `check:schedule-pdf`, TypeScript, lint, `next build`), pero **no se marcó
  `done`**: `docs/verification.md` exige browser smoke para páginas UI y el
  tablero nunca se probó autenticado. Su propia nota además reporta un FK
  `JobOccurrence_updatedById_fkey` por cookie de sesión vieja: hay que cerrar
  sesión y volver a entrar antes de probar arrastre, alta y borrado.
- Feature 26 - `ops_visits_guided_workflow` sigue `pending` sin cambios de
  código.
