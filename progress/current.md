# Current Harness Session

Status: in_progress

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
